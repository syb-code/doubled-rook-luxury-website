-- MyHotelAuditor.com — M2 spike core schema.
-- Faithful subset of docs/09. Postgres dialect, snake_case, uuid pks,
-- created_at/updated_at on every table, enums as text + check constraints (§1).
--
-- Spike subset: accounts/orders/credits_ledger are minimal but present, because
-- non-negotiable #2 (payment is the only gate) and #8 (money in cents, credits
-- as a ledger) must have a home in code even though Stripe is out of scope.
-- Out of this migration: users, memberships, properties registry beyond website,
-- intake_sessions, module_catalog, price_book, sample_reports, reports delivery.

BEGIN;

-- gen_random_uuid() is Postgres core since 13 — no pgcrypto extension needed,
-- which keeps the schema portable across Neon, RDS and local engines (docs/09 §1).

-- ---------------------------------------------------------------------------
-- Accounts / money  (non-negotiable #2, #8)
-- ---------------------------------------------------------------------------

CREATE TABLE accounts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  kind        text NOT NULL DEFAULT 'internal'
                CHECK (kind IN ('customer', 'internal', 'partner')),
  deleted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Money in integer cents, always (non-negotiable #8).
CREATE TABLE orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid NOT NULL REFERENCES accounts(id),
  stripe_ref    text,
  kind          text NOT NULL CHECK (kind IN ('per_run', 'credit_pack')),
  amount_cents  integer NOT NULL,
  currency      text NOT NULL DEFAULT 'usd',
  promo_code    text,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'paid', 'refunded', 'failed')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Balance is SUM(delta), never a stored number (non-negotiable #8; BILL-3).
CREATE TABLE credits_ledger (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid NOT NULL REFERENCES accounts(id),
  delta       integer NOT NULL CHECK (delta <> 0),   -- docs/09 §5: non-zero deltas
  reason      text NOT NULL
                CHECK (reason IN ('purchase', 'run', 'expiry', 'refund', 'grant')),
  order_id    uuid REFERENCES orders(id),
  run_id      uuid,                                   -- FK added after runs exists
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Properties  (non-negotiable #7 — provenance travels with all data)
-- ---------------------------------------------------------------------------

CREATE TABLE properties (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   uuid NOT NULL REFERENCES accounts(id),
  name         text NOT NULL,
  address      text,
  city         text,
  region       text,
  country      text,
  brand_flag   text,                                  -- null for independents
  website_url  text NOT NULL,
  status       text NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'archived')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE property_registry (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    uuid NOT NULL REFERENCES properties(id),
  kind           text NOT NULL
                   CHECK (kind IN ('ota_listing', 'review_listing',
                                   'social_handle', 'booking_engine')),
  platform       text NOT NULL,
  url_or_handle  text NOT NULL,
  -- Provenance labeled at write, displayed at read (non-negotiable #7; PROP-4).
  provenance     text NOT NULL
                   CHECK (provenance IN ('auto_discovered', 'buyer_confirmed',
                                         'analyst_entered', 'buyer_supplied')),
  verified_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Runs  (RUN-1, RUN-2, RUN-4; non-negotiable #5 — pinned versions)
-- ---------------------------------------------------------------------------

CREATE TABLE runs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  uuid NOT NULL REFERENCES properties(id),
  account_id   uuid NOT NULL REFERENCES accounts(id),
  -- 'spike' is a spike-only lane. Production lanes are gated on a paid order
  -- (non-negotiable #2 / BILL-2); see src/lib/payment-gate.ts.
  lane         text NOT NULL
                 CHECK (lane IN ('self_serve', 'concierge', 'batch', 'teaser', 'spike')),
  order_id     uuid REFERENCES orders(id),
  status       text NOT NULL DEFAULT 'created'
                 CHECK (status IN ('created', 'collecting', 'analyzing', 'scoring',
                                   'rendering', 'qa', 'delivered', 'failed')),
  -- The reproducibility trio. Immutable once written (non-negotiable #5; RUN-4).
  prompt_bundle_version  text NOT NULL,
  rubric_version         text NOT NULL,
  template_version       text NOT NULL,
  campaign_tag   text,
  failure_class  text
                   CHECK (failure_class IS NULL OR failure_class IN
                     ('source_unavailable', 'payment', 'rendering', 'model_error',
                      'validation', 'internal')),
  cost_cents     integer,                             -- metered marginal cost (#8)
  started_at     timestamptz,
  completed_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE credits_ledger
  ADD CONSTRAINT credits_ledger_run_id_fkey FOREIGN KEY (run_id) REFERENCES runs(id);

-- BILL-2 / non-negotiable #2: a non-spike run must reference an order.
-- Payment status itself is checked in code before enqueue; this is the floor.
ALTER TABLE runs ADD CONSTRAINT runs_paid_lane_requires_order
  CHECK (lane = 'spike' OR order_id IS NOT NULL);

CREATE TABLE run_modules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id       uuid NOT NULL REFERENCES runs(id),
  module_code  text NOT NULL,
  status       text NOT NULL DEFAULT 'created'
                 CHECK (status IN ('created', 'collecting', 'analyzing', 'scoring',
                                   'rendering', 'qa', 'delivered', 'failed')),
  score        integer CHECK (score IS NULL OR (score BETWEEN 0 AND 100)),
  attempts     integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, module_code)
);

-- ---------------------------------------------------------------------------
-- Evidence chain  (non-negotiable #1; ING-2, ANA-1, ANA-2)
-- ---------------------------------------------------------------------------

-- Immutable. No UPDATE path exists in application code; object_key is
-- content-addressed so a rewrite would land at a different key by construction.
CREATE TABLE source_snapshots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          uuid NOT NULL REFERENCES runs(id),
  property_id     uuid NOT NULL REFERENCES properties(id),
  source_kind     text NOT NULL
                    CHECK (source_kind IN ('website_html', 'rendered_dom', 'lighthouse',
                                           'review_batch', 'listing', 'probe_panel',
                                           'social_profile', 'serp')),
  platform        text,
  url             text NOT NULL,
  object_key      text NOT NULL UNIQUE,               -- content-addressed, write-once
  content_sha256  text NOT NULL,
  byte_size       integer NOT NULL,
  -- Licensed / official channels only (non-negotiable #6; docs/07 §6).
  capture_method  text NOT NULL
                    CHECK (capture_method IN ('api', 'licensed_provider',
                                              'first_party', 'analyst_entry')),
  captured_at     timestamptz NOT NULL,               -- displayed in evidence blocks
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE observations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id       uuid NOT NULL REFERENCES runs(id),
  snapshot_id  uuid NOT NULL REFERENCES source_snapshots(id),  -- provenance chain
  module_code  text NOT NULL,
  kind         text NOT NULL
                 CHECK (kind IN ('review', 'listing_field', 'probe_row',
                                 'metric', 'profile_stat')),
  payload      jsonb NOT NULL,                        -- schema-validated in code
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE findings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id       uuid NOT NULL REFERENCES runs(id),
  module_code  text NOT NULL,
  code         text NOT NULL,                         -- F-01, M-04 … unique per run
  severity     text NOT NULL
                 CHECK (severity IN ('critical', 'moderate', 'minor',
                                     'advisory', 'positive', 'data_gap')),
  dimension    text NOT NULL,                         -- scoring dimension tag
  title        text NOT NULL,
  prose        text NOT NULL,
  remediation  jsonb,
  qa_status    text NOT NULL DEFAULT 'auto'
                 CHECK (qa_status IN ('auto', 'approved', 'edited', 'removed')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, code)
);

-- docs/09 §5: finding_evidence requires a resolvable target.
CREATE TABLE finding_evidence (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id      uuid NOT NULL REFERENCES findings(id),
  snapshot_id     uuid REFERENCES source_snapshots(id),
  observation_id  uuid REFERENCES observations(id),
  note            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT finding_evidence_resolvable
    CHECK (snapshot_id IS NOT NULL OR observation_id IS NOT NULL)
);

-- ---------------------------------------------------------------------------
-- Scoring & reports  (non-negotiable #3, #5)
-- ---------------------------------------------------------------------------

CREATE TABLE scores (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            uuid NOT NULL REFERENCES runs(id),
  scope             text NOT NULL,                    -- module code or 'composite'
  value             integer NOT NULL CHECK (value BETWEEN 0 AND 100),
  band              text NOT NULL,
  triggers_applied  jsonb NOT NULL DEFAULT '[]'::jsonb,
  breakdown         jsonb NOT NULL DEFAULT '{}'::jsonb,
  rubric_version    text NOT NULL,                    -- pinned (#5; SCOR-4)
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, scope)
);

CREATE TABLE reports (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            uuid NOT NULL REFERENCES runs(id) UNIQUE,
  html_object_key   text,
  pdf_object_key    text,
  template_version  text NOT NULL,
  watermark         boolean NOT NULL DEFAULT false,
  page_count        integer,
  qa_passed_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Version registries + events
-- ---------------------------------------------------------------------------

CREATE TABLE rubric_versions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version     text NOT NULL UNIQUE,
  definition  jsonb NOT NULL,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE prompt_versions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle           text NOT NULL,
  version          text NOT NULL,
  body_object_key  text NOT NULL,
  changelog        text,
  status           text NOT NULL DEFAULT 'active'
                     CHECK (status IN ('draft', 'active', 'retired')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bundle, version)
);

CREATE TABLE events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   uuid REFERENCES accounts(id),
  run_id       uuid REFERENCES runs(id),
  property_id  uuid REFERENCES properties(id),
  name         text NOT NULL,                         -- run.created, report.rendered …
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON runs (property_id, created_at DESC);
CREATE INDEX ON source_snapshots (run_id, source_kind);
CREATE INDEX ON observations (run_id, module_code);
CREATE INDEX ON findings (run_id, severity);
CREATE INDEX ON finding_evidence (finding_id);
CREATE INDEX ON events (run_id, occurred_at DESC);

COMMIT;
