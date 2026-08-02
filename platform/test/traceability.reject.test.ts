// THE SPIKE'S PASS/FAIL — CLAUDE.md success criterion:
// "zero unevidenced findings pass the validator".
//
// Each test below is one clause of the docs/08 §3 traceability protocol,
// asserted as a rejection rather than as a prompt instruction.
import { describe, expect, it } from 'vitest';
import { validateFindings, type EvidenceUniverse } from '../src/lib/validators/traceability.js';

const OBS_LCP = '11111111-1111-4111-8111-111111111111';
const OBS_MISSING = '22222222-2222-4222-8222-222222222222';
const SNAP_DOM = '33333333-3333-4333-8333-333333333333';

function universe(): EvidenceUniverse {
  return {
    observations: new Map<string, unknown>([
      [OBS_LCP, { metric: 'largest_contentful_paint', value_ms: 4200, strategy: 'mobile' }],
    ]),
    snapshots: new Map([
      [SNAP_DOM, { url: 'https://theiveyshotel.com/', source_kind: 'rendered_dom' }],
    ]),
    property: { name: "The Ivey's Hotel", website_url: 'https://theiveyshotel.com' },
  };
}

const base = {
  code: 'F-01',
  severity: 'moderate' as const,
  dimension: 'performance' as const,
  title: 'Mobile LCP exceeds threshold',
  prose: 'Largest Contentful Paint measured 4200 ms on mobile.',
  evidence: [{ observation_id: OBS_LCP, note: 'PSI mobile lab metric' }],
};

describe('traceability gate (non-negotiable #1, docs/08 §3)', () => {
  it('accepts a fully evidenced finding whose numbers are sourced', () => {
    const r = validateFindings([base], universe());
    expect(r.accepted).toHaveLength(1);
    expect(r.rejected).toHaveLength(0);
  });

  it('REJECTS a finding carrying no evidence reference', () => {
    const r = validateFindings([{ ...base, evidence: [] }], universe());
    expect(r.accepted).toHaveLength(0);
    expect(r.rejected[0]!.reasons.map((x) => x.code)).toContain('no_evidence');
  });

  it('REJECTS an evidence reference that resolves to nothing', () => {
    const r = validateFindings(
      [{ ...base, evidence: [{ observation_id: OBS_MISSING, note: 'phantom' }] }],
      universe(),
    );
    expect(r.accepted).toHaveLength(0);
    expect(r.rejected[0]!.reasons.map((x) => x.code)).toContain('unresolvable_reference');
  });

  it('REJECTS a numeric claim absent from the cited observation', () => {
    // The observation says 4200 ms; the prose asserts 9800 ms.
    const r = validateFindings(
      [{ ...base, prose: 'Largest Contentful Paint measured 9800 ms on mobile.' }],
      universe(),
    );
    expect(r.accepted).toHaveLength(0);
    const reasons = r.rejected[0]!.reasons;
    expect(reasons.map((x) => x.code)).toContain('unsourced_number');
    expect(reasons.find((x) => x.code === 'unsourced_number')!.detail).toMatch(/9800/);
  });

  it('REJECTS cross-property contamination (docs/08 §9, release-blocking)', () => {
    const r = validateFindings(
      [{ ...base, prose: 'Compare https://someotherhotel.com/rooms — 4200 ms.' }],
      universe(),
    );
    expect(r.accepted).toHaveLength(0);
    expect(r.rejected[0]!.reasons.map((x) => x.code)).toContain(
      'cross_property_contamination',
    );
  });

  it('REJECTS output that fails the declared schema', () => {
    const r = validateFindings([{ ...base, code: 'Z-99' }], universe());
    expect(r.accepted).toHaveLength(0);
    expect(r.rejected[0]!.reasons.map((x) => x.code)).toContain('schema_invalid');
  });

  it('accepts a DATA GAP that declares sought / why / how, without evidence', () => {
    const gap = {
      code: 'M-01',
      severity: 'data_gap' as const,
      dimension: 'measurement_integrity' as const,
      title: 'GA4 server-side configuration not observable',
      prose: 'Container fires, but server-side tagging cannot be confirmed externally.',
      evidence: [],
      data_gap: {
        sought: 'GA4 server-side tagging configuration',
        why_unavailable: 'Requires authenticated access to the GA4 property',
        how_to_obtain: 'Property supplies a GA4 admin export or read-only access',
      },
    };
    const r = validateFindings([gap], universe());
    expect(r.accepted).toHaveLength(1);
  });

  it('REJECTS a DATA GAP that does not declare itself', () => {
    const r = validateFindings(
      [
        {
          code: 'M-02',
          severity: 'data_gap' as const,
          dimension: 'measurement_integrity' as const,
          title: 'Something unclear',
          prose: 'Could not really tell.',
          evidence: [],
        },
      ],
      universe(),
    );
    expect(r.accepted).toHaveLength(0);
    expect(r.rejected[0]!.reasons.map((x) => x.code)).toContain('data_gap_incomplete');
  });

  it('lets nothing unevidenced through a mixed batch — the spike criterion', () => {
    const batch = [
      base,                                             // valid
      { ...base, code: 'F-02', evidence: [] },          // unevidenced
      { ...base, code: 'F-03', prose: 'Scored 77 overall.' }, // unsourced number
      { ...base, code: 'F-04', evidence: [{ observation_id: OBS_MISSING, note: 'x' }] },
    ];
    const r = validateFindings(batch, universe());
    expect(r.accepted.map((f) => f.code)).toEqual(['F-01']);
    expect(r.rejected).toHaveLength(3);
  });
});
