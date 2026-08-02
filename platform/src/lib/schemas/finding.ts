// Structured-output schema for the analysis stage (docs/08 §2 — every model call
// returns JSON against a declared schema; invalid output is retried, then failed,
// never hand-parsed).
import { z } from 'zod';

export const SEVERITIES = [
  'critical',
  'moderate',
  'minor',
  'advisory',
  'positive',
  'data_gap',
] as const;
export type Severity = (typeof SEVERITIES)[number];

export const M2_DIMENSIONS = [
  'performance',
  'accessibility',
  'measurement_integrity',
  'seo_aeo_readiness',
  'booking_path_cro',
] as const;

// M2 spans two chapters: Website & Accessibility (F-##) and Marketing &
// Measurement (M-##) — docs/03 M2, open item #9 confirmed for the spike.
export const M2_FINDING_CODE = /^[FM]-\d{2}$/;

export const EvidenceRefSchema = z
  .object({
    snapshot_id: z.string().uuid().optional(),
    observation_id: z.string().uuid().optional(),
    note: z.string().min(1, 'evidence note states what this evidences'),
  })
  .refine((r) => Boolean(r.snapshot_id ?? r.observation_id), {
    message: 'evidence reference must name a snapshot_id or an observation_id',
  });

// A DATA GAP must say what was sought, why it was unavailable, and how to obtain
// it (docs/08 §3). It replaces evidence rather than carrying it — a gap is the
// absence of evidence, so requiring an evidence ref would be incoherent.
export const DataGapDetailSchema = z.object({
  sought: z.string().min(1),
  why_unavailable: z.string().min(1),
  how_to_obtain: z.string().min(1),
});

export const FindingSchema = z.object({
  code: z.string().regex(M2_FINDING_CODE, 'M2 findings use the F-## or M-## families'),
  severity: z.enum(SEVERITIES),
  dimension: z.enum(M2_DIMENSIONS),
  title: z.string().min(1),
  prose: z.string().min(1),
  evidence: z.array(EvidenceRefSchema).default([]),
  data_gap: DataGapDetailSchema.optional(),
  remediation: z.object({ text: z.string(), playbook_refs: z.array(z.string()).default([]) }).optional(),
});

export type Finding = z.infer<typeof FindingSchema>;

export const AnalysisOutputSchema = z.object({
  findings: z.array(FindingSchema),
});

export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;
