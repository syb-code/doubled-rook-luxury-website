// THE HARD GATE — docs/08 §3, CLAUDE.md non-negotiable #1.
//
// "Enforced by validators in the pipeline, not by prompt suggestion alone."
// A finding that fails any check here never reaches a report. This module is
// pure and runtime-agnostic: no I/O, no Node APIs, so it runs unchanged inside
// a Worker and inside vitest.

import { FindingSchema, type Finding } from '../schemas/finding.js';

export interface EvidenceUniverse {
  /** observation id -> payload actually stored for this run */
  observations: Map<string, unknown>;
  /** snapshot id -> stored snapshot metadata for this run */
  snapshots: Map<string, { url: string; source_kind: string }>;
  /** the run's property — anything else appearing in output is contamination */
  property: { name: string; website_url: string };
}

export type RejectionCode =
  | 'schema_invalid'
  | 'no_evidence'
  | 'unresolvable_reference'
  | 'unsourced_number'
  | 'cross_property_contamination'
  | 'data_gap_incomplete';

export interface Rejection {
  code: RejectionCode;
  detail: string;
}

export interface ValidationResult {
  accepted: Finding[];
  rejected: Array<{ finding: unknown; reasons: Rejection[] }>;
}

/** Numeric tokens in prose: 12, 1,240, 3.5, 98%, $1.20 */
const NUMBER_TOKEN = /-?\d[\d,]*(?:\.\d+)?/g;

/** Normalize so "1,240" and "1240" and "1240.00" compare equal. */
function normalizeNumber(raw: string): string | null {
  const n = Number(raw.replace(/,/g, ''));
  return Number.isFinite(n) ? String(n) : null;
}

/** Every number appearing anywhere in a stored observation payload. */
function collectNumbers(value: unknown, into: Set<string>): void {
  if (typeof value === 'number' && Number.isFinite(value)) {
    into.add(String(value));
    return;
  }
  if (typeof value === 'string') {
    for (const m of value.matchAll(NUMBER_TOKEN)) {
      const n = normalizeNumber(m[0]);
      if (n !== null) into.add(n);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) collectNumbers(v, into);
    return;
  }
  if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectNumbers(v, into);
  }
}

function hostOf(url: string): string | null {
  const m = /^https?:\/\/([^/?#]+)/i.exec(url.trim());
  return m?.[1]?.toLowerCase().replace(/^www\./, '') ?? null;
}

/**
 * Validate model-produced findings against the evidence actually stored for the
 * run. Returns accepted findings and, for every rejection, why it failed —
 * rejections are surfaced, never silently dropped (ANA-3).
 */
export function validateFindings(
  raw: unknown[],
  universe: EvidenceUniverse,
): ValidationResult {
  const accepted: Finding[] = [];
  const rejected: ValidationResult['rejected'] = [];

  const propertyHost = hostOf(universe.property.website_url);

  for (const candidate of raw) {
    const reasons: Rejection[] = [];

    const parsed = FindingSchema.safeParse(candidate);
    if (!parsed.success) {
      rejected.push({
        finding: candidate,
        reasons: [
          {
            code: 'schema_invalid',
            detail: parsed.error.issues
              .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
              .join('; '),
          },
        ],
      });
      continue;
    }
    const finding = parsed.data;

    // --- Rule 1: a DATA GAP declares itself; everything else carries evidence.
    if (finding.severity === 'data_gap') {
      if (!finding.data_gap) {
        reasons.push({
          code: 'data_gap_incomplete',
          detail:
            'DATA GAP must state what was sought, why it was unavailable, and how to obtain it',
        });
      }
    } else if (finding.evidence.length === 0) {
      reasons.push({
        code: 'no_evidence',
        detail: 'finding carries no evidence reference',
      });
    }

    // --- Rule 2: every reference must resolve to something actually stored.
    const citedNumbers = new Set<string>();
    for (const ref of finding.evidence) {
      if (ref.observation_id) {
        if (!universe.observations.has(ref.observation_id)) {
          reasons.push({
            code: 'unresolvable_reference',
            detail: `observation_id ${ref.observation_id} is not stored for this run`,
          });
        } else {
          collectNumbers(universe.observations.get(ref.observation_id), citedNumbers);
        }
      }
      if (ref.snapshot_id && !universe.snapshots.has(ref.snapshot_id)) {
        reasons.push({
          code: 'unresolvable_reference',
          detail: `snapshot_id ${ref.snapshot_id} is not stored for this run`,
        });
      }
    }

    // --- Rule 3: every numeric claim in prose must exist in a cited observation.
    if (finding.severity !== 'data_gap') {
      const claimed = new Set<string>();
      for (const m of finding.prose.matchAll(NUMBER_TOKEN)) {
        const n = normalizeNumber(m[0]);
        if (n !== null) claimed.add(n);
      }
      for (const n of claimed) {
        if (!citedNumbers.has(n)) {
          reasons.push({
            code: 'unsourced_number',
            detail: `prose asserts ${n}, which appears in no cited observation`,
          });
        }
      }
    }

    // --- Rule 4: cross-property contamination is release-blocking (docs/08 §9).
    if (propertyHost) {
      const text = `${finding.title} ${finding.prose}`;
      for (const m of text.matchAll(/https?:\/\/[^\s)"'<>]+/g)) {
        const h = hostOf(m[0]);
        if (h && h !== propertyHost && !h.endsWith(`.${propertyHost}`)) {
          reasons.push({
            code: 'cross_property_contamination',
            detail: `output references foreign host ${h}; run property is ${propertyHost}`,
          });
        }
      }
    }

    if (reasons.length > 0) rejected.push({ finding: candidate, reasons });
    else accepted.push(finding);
  }

  return { accepted, rejected };
}
