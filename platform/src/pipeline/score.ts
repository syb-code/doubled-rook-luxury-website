// DETERMINISTIC SCORING — CLAUDE.md non-negotiable #3, docs/08 §5, SCOR-1..4.
//
// "Scoring is deterministic code under pinned rubric versions — never model
// output. Same findings + same rubric version = same score, provable by test."
//
// Nothing in this module calls a model, reads a clock, or touches I/O.

import type { Finding, Severity } from '../lib/schemas/finding.js';

export interface Rubric {
  version: string;
  module: string;
  numeric_layer: {
    start: number;
    floor: number;
    ceiling: number;
    severity_deltas: Record<Severity, number>;
    positive_cap: number;
  };
  bands: Array<{ label: string; min: number; max: number }>;
  rule_triggers: Array<{
    id: string;
    counts_severities: Severity[];
    threshold: number;
    forces_band: string;
  }>;
}

export interface DeductionLine {
  code: string;
  severity: Severity;
  dimension: string;
  delta: number;
}

export interface ScoreResult {
  scope: string;
  value: number;
  band: string;
  rubric_version: string;
  triggers_applied: string[];
  breakdown: {
    ledger: DeductionLine[];
    by_dimension: Record<string, number>;
    positive_credit_applied: number;
    positive_credit_forgone: number;
  };
}

// ANA-4: findings are stably ordered — severity, then family, then sequence —
// so the deduction ledger is byte-identical across runs.
const SEVERITY_ORDER: Severity[] = [
  'critical',
  'moderate',
  'minor',
  'advisory',
  'positive',
  'data_gap',
];

export function orderFindings(findings: readonly Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const s = SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
    if (s !== 0) return s;
    const fa = a.code.charAt(0);
    const fb = b.code.charAt(0);
    if (fa !== fb) return fa < fb ? -1 : 1;
    return a.code.localeCompare(b.code);
  });
}

export function scoreModule(
  findings: readonly Finding[],
  rubric: Rubric,
  scope = rubric.module,
): ScoreResult {
  const { start, floor, ceiling, severity_deltas, positive_cap } = rubric.numeric_layer;
  const ordered = orderFindings(findings);

  const ledger: DeductionLine[] = [];
  const byDimension: Record<string, number> = {};
  let positiveRaw = 0;

  for (const f of ordered) {
    const delta = severity_deltas[f.severity] ?? 0;

    if (f.severity === 'positive') {
      positiveRaw += delta;
      // Credit is capped in aggregate, so it is applied after the loop; the
      // ledger still records what each positive finding contributed pre-cap.
      ledger.push({ code: f.code, severity: f.severity, dimension: f.dimension, delta });
      continue;
    }

    ledger.push({ code: f.code, severity: f.severity, dimension: f.dimension, delta });
    byDimension[f.dimension] = (byDimension[f.dimension] ?? 0) + delta;
  }

  const positiveApplied = Math.min(positiveRaw, positive_cap);
  const deductions = ledger
    .filter((l) => l.severity !== 'positive')
    .reduce((sum, l) => sum + l.delta, 0);

  const raw = start + deductions + positiveApplied;
  const value = Math.max(floor, Math.min(ceiling, raw));

  // Rule triggers apply AFTER the numeric layer and can force a band
  // regardless of the computed value (docs/08 §5.2).
  let band = bandFor(value, rubric);
  const triggersApplied: string[] = [];

  for (const trigger of rubric.rule_triggers) {
    const count = ordered.filter((f) => trigger.counts_severities.includes(f.severity)).length;
    if (count >= trigger.threshold) {
      band = trigger.forces_band;
      triggersApplied.push(trigger.id);
    }
  }

  return {
    scope,
    value,
    band,
    rubric_version: rubric.version,
    triggers_applied: triggersApplied,
    breakdown: {
      ledger,
      by_dimension: byDimension,
      positive_credit_applied: positiveApplied,
      positive_credit_forgone: positiveRaw - positiveApplied,
    },
  };
}

export function bandFor(value: number, rubric: Rubric): string {
  const hit = rubric.bands.find((b) => value >= b.min && value <= b.max);
  if (!hit) {
    // A rubric whose bands do not cover the whole range is a rubric bug, and
    // an unlabeled score must never reach a report (SCOR-3).
    throw new Error(
      `rubric ${rubric.version} defines no band covering score ${value}`,
    );
  }
  return hit.label;
}
