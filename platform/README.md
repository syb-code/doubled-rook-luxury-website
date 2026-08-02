# MyHotelAuditor.com — Platform

A Doubled Rook product: automated, evidence-backed hotel marketing audits sold as
modular reports.

**Status: M2 spike (docs/07 §4).** This repository currently holds a time-boxed
architectural spike whose only job is to ratify or kill Option A (Cloudflare
Workers + Queues + Neon via Hyperdrive + R2 + Browser Rendering) before anything
is built on top of it. Spike code is disposable; the findings about the
non-negotiables are not.

## The slice

`POST /v1/runs` (no auth, no billing) → queue consumer → capture (raw HTML +
rendered DOM via Browser Rendering; Lighthouse via the PageSpeed Insights API) →
immutable snapshots to R2 + metadata to Neon → one analysis pass (Anthropic,
schema-validated findings with evidence references, validator rejects any
unevidenced finding) → deterministic M2 score → minimal HTML report + PDF to R2.

Out of scope: auth, Stripe, intake, email delivery, the brand-system report
template, the QA queue.

## Where the non-negotiables live in code

| # | Non-negotiable | Enforced by |
|---|---|---|
| 1 | Traceability | `src/lib/validators/traceability.ts`; `finding_evidence_resolvable` constraint |
| 2 | Payment is the only gate | `runs_paid_lane_requires_order` constraint |
| 3 | Scoring is deterministic code | `src/pipeline/score.ts` (no model, no clock, no I/O) |
| 4 | Intake rules are deterministic | *not in this slice — intake is out of spike scope* |
| 5 | Snapshots are immutable | content-addressed write-once `object_key`; pinned version trio on `runs` |
| 6 | Licensed / official channels only | first-party site capture + official PSI API only |
| 7 | Provenance travels with data | `provenance` / `capture_method` columns, labeled at write |
| 8 | Money in cents; credits ledgered | `amount_cents`, `cost_cents`; `credits_ledger` with SUM-derived balance |

## Layout

```
migrations/   Postgres schema — faithful subset of docs/09
src/lib/      schemas, validators, provider-abstracted model client
src/pipeline/ capture → extract → analyze → score → render
src/rubric/   pinned rubric definitions
test/         constraint, traceability and determinism suites
wrangler.jsonc  infrastructure as configuration (docs/07 §9)
```

## Setup

```bash
npm install
cp .dev.vars.example .dev.vars   # then fill it in — never commit it
npm run typecheck
npm test
```

`npm test` runs entirely offline: the migration suite applies the schema to
PGlite (Postgres compiled to WASM), and the traceability and scoring suites are
pure functions over fixtures.

## Open items this spike must not resolve silently

Per CLAUDE.md, open decisions are flagged, never decided in code. Two are load-bearing here:

- **Open item #7 — v7 rubric verbatim import.** `src/rubric/m2.rubric.v0.1.0.json`
  uses the docs/08 §5.2 draft numeric layer. Only the "Critically in Need" band is
  confirmed from v7; the other four band labels, every boundary, and the rule-2
  volume threshold are spike placeholders and must not reach a customer-facing
  report.
- **Open item #12 — turnaround and cost ceilings.** Measured by this spike; the
  numbers fill placeholders in docs/02 §3 and docs/07 §8.
