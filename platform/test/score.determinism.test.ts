// SCOR-4 / non-negotiable #3: same findings + same rubric version = same score.
// Also runs the docs/08 §5.3 calibration fit test against the Ivey's golden set.
import { describe, expect, it } from 'vitest';
import rubricJson from '../src/rubric/m2.rubric.v0.1.0.json';
import { scoreModule, orderFindings, type Rubric } from '../src/pipeline/score.js';
import type { Finding, Severity } from '../src/lib/schemas/finding.js';

const rubric = rubricJson as unknown as Rubric;

let seq = 0;
function finding(severity: Severity, dimension = 'performance', family = 'F'): Finding {
  seq += 1;
  return {
    code: `${family}-${String(seq).padStart(2, '0')}`,
    severity,
    dimension: dimension as Finding['dimension'],
    title: 't',
    prose: 'p',
    evidence: [],
  };
}

function mix(counts: Partial<Record<Severity, number>>): Finding[] {
  const out: Finding[] = [];
  for (const [sev, n] of Object.entries(counts)) {
    for (let i = 0; i < (n ?? 0); i += 1) out.push(finding(sev as Severity));
  }
  return out;
}

describe('deterministic scoring (non-negotiable #3, SCOR-4)', () => {
  it('produces an identical result across repeated runs and input orderings', () => {
    const findings = mix({ critical: 1, moderate: 3, minor: 2, positive: 4, advisory: 1 });

    const a = scoreModule(findings, rubric);
    const b = scoreModule(findings, rubric);
    // Shuffled input must not change the outcome — ordering is imposed, not assumed.
    const c = scoreModule([...findings].reverse(), rubric);

    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(a)).toBe(JSON.stringify(c));
  });

  it('applies the documented severity deltas exactly (docs/08 §5.2)', () => {
    // 100 − 25 − 8 − 3 = 64
    const r = scoreModule(mix({ critical: 1, moderate: 1, minor: 1 }), rubric);
    expect(r.value).toBe(64);
    expect(r.band).toBe('Needs Attention');
  });

  it('treats advisory as zero-weight and data_gap as non-punitive', () => {
    expect(scoreModule(mix({ advisory: 5 }), rubric).value).toBe(100);
    expect(scoreModule(mix({ data_gap: 5 }), rubric).value).toBe(100);
  });

  it('caps positive credit at +6 and records what was forgone', () => {
    const r = scoreModule(mix({ positive: 9 }), rubric);
    expect(r.value).toBe(100); // 100 + 6, clamped at the ceiling
    expect(r.breakdown.positive_credit_applied).toBe(6);
    expect(r.breakdown.positive_credit_forgone).toBe(12); // 9×2 − 6
  });

  it('floors at 0 rather than going negative', () => {
    expect(scoreModule(mix({ critical: 10 }), rubric).value).toBe(0);
  });

  it('orders findings by severity, then family, then code', () => {
    const ordered = orderFindings([
      { ...finding('minor', 'performance', 'M') },
      { ...finding('critical', 'performance', 'M') },
      { ...finding('critical', 'performance', 'F') },
    ]);
    expect(ordered.map((f) => `${f.severity}:${f.code.charAt(0)}`)).toEqual([
      'critical:F',
      'critical:M',
      'minor:M',
    ]);
  });
});

// docs/08 §5.3 — "the numeric layer must place golden-set properties in the same
// band the shipped rubric assigned; disagreement is a rubric bug until proven
// otherwise." The Ivey's audit: 35 findings, 1C/20Mo/5Mi/9Pos → "Critically in Need".
describe('golden-set calibration — Ivey\'s (docs/08 §5.3)', () => {
  const iveys = mix({ critical: 1, moderate: 20, minor: 5, positive: 9 });

  it('reproduces the shipped band', () => {
    const r = scoreModule(iveys, rubric);
    // 100 − 25 − 160 − 15 + 6 = −94 → floored to 0
    expect(r.value).toBe(0);
    expect(r.band).toBe('Critically in Need');
  });

  it('fires the rule-2 volume trigger on the same finding mix', () => {
    const r = scoreModule(iveys, rubric);
    expect(r.triggers_applied).toContain('rule_2_volume');
  });

  it('has 35 findings, matching the hand audit', () => {
    expect(iveys).toHaveLength(35);
  });
});
