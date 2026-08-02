// Proves the M2 spike migration applies to a real Postgres engine and that the
// constraints carrying the non-negotiables actually bite. Uses PGlite (Postgres
// compiled to WASM) so this runs with no network and no server.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

// import.meta.url is a string, so fileURLToPath's string overload is used here.
// Passing a URL object instead collides with the Workers-types global URL.
const HERE = fileURLToPath(import.meta.url);
const MIGRATION = readFileSync(
  HERE.replace(/test[/\\][^/\\]+$/, 'migrations/0001_m2_spike_core.sql'),
  'utf8',
);

let db: PGlite;
let accountId: string;
let propertyId: string;

async function seedRun(lane: string, orderId: string | null) {
  const [row] = (
    await db.query<{ id: string }>(
      `INSERT INTO runs (property_id, account_id, lane, order_id,
                         prompt_bundle_version, rubric_version, template_version)
       VALUES ($1, $2, $3, $4, 'm2-spike-0.1.0', 'm2-spike-0.1.0', 'm2-spike-0.1.0')
       RETURNING id`,
      [propertyId, accountId, lane, orderId],
    )
  ).rows;
  return row!.id;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(MIGRATION);

  accountId = (
    await db.query<{ id: string }>(
      `INSERT INTO accounts (name, kind) VALUES ('Doubled Rook', 'internal') RETURNING id`,
    )
  ).rows[0]!.id;

  propertyId = (
    await db.query<{ id: string }>(
      `INSERT INTO properties (account_id, name, website_url)
       VALUES ($1, 'The Ivey''s Hotel', 'https://theiveyshotel.com') RETURNING id`,
      [accountId],
    )
  ).rows[0]!.id;
});

describe('migration 0001', () => {
  it('creates every table the M2 spike pipeline writes to', async () => {
    const { rows } = await db.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' ORDER BY table_name`,
    );
    expect(rows.map((r) => r.table_name)).toEqual([
      'accounts',
      'credits_ledger',
      'events',
      'finding_evidence',
      'findings',
      'observations',
      'orders',
      'prompt_versions',
      'properties',
      'property_registry',
      'reports',
      'rubric_versions',
      'run_modules',
      'runs',
      'scores',
      'source_snapshots',
    ]);
  });
});

// Non-negotiable #2 — payment is the only gate that starts a run (BILL-2).
describe('payment gate (non-negotiable #2)', () => {
  it('rejects a self_serve run with no order at the database floor', async () => {
    await expect(seedRun('self_serve', null)).rejects.toThrow(
      /runs_paid_lane_requires_order/,
    );
  });

  it('permits the spike lane without an order', async () => {
    await expect(seedRun('spike', null)).resolves.toMatch(/^[0-9a-f-]{36}$/);
  });
});

// Non-negotiable #1 — every finding carries a resolvable evidence reference.
describe('evidence chain (non-negotiable #1)', () => {
  it('rejects finding_evidence that resolves to nothing', async () => {
    const runId = await seedRun('spike', null);
    const findingId = (
      await db.query<{ id: string }>(
        `INSERT INTO findings (run_id, module_code, code, severity, dimension, title, prose)
         VALUES ($1, 'M2', 'F-01', 'moderate', 'performance', 't', 'p') RETURNING id`,
        [runId],
      )
    ).rows[0]!.id;

    await expect(
      db.query(
        `INSERT INTO finding_evidence (finding_id, note) VALUES ($1, 'nothing')`,
        [findingId],
      ),
    ).rejects.toThrow(/finding_evidence_resolvable/);
  });
});

// Non-negotiable #8 — credits are a ledger; balance is a SUM of deltas.
describe('credits ledger (non-negotiable #8)', () => {
  it('rejects a zero delta and derives balance by SUM', async () => {
    await expect(
      db.query(
        `INSERT INTO credits_ledger (account_id, delta, reason)
         VALUES ($1, 0, 'grant')`,
        [accountId],
      ),
    ).rejects.toThrow(/credits_ledger_delta_check/);

    await db.query(
      `INSERT INTO credits_ledger (account_id, delta, reason)
       VALUES ($1, 10, 'grant'), ($1, -3, 'run')`,
      [accountId],
    );
    const { rows } = await db.query<{ balance: number }>(
      `SELECT COALESCE(SUM(delta), 0)::int AS balance
       FROM credits_ledger WHERE account_id = $1`,
      [accountId],
    );
    expect(rows[0]!.balance).toBe(7);
  });
});

// Non-negotiable #5 — snapshots are immutable; object keys are content-addressed.
describe('snapshot immutability (non-negotiable #5)', () => {
  it('refuses a second snapshot at the same content-addressed key', async () => {
    const runId = await seedRun('spike', null);
    const insert = () =>
      db.query(
        `INSERT INTO source_snapshots
           (run_id, property_id, source_kind, url, object_key, content_sha256,
            byte_size, capture_method, captured_at)
         VALUES ($1, $2, 'website_html', 'https://theiveyshotel.com',
                 'snapshots/deadbeef', 'deadbeef', 1024, 'first_party', now())`,
        [runId, propertyId],
      );
    await insert();
    await expect(insert()).rejects.toThrow(/source_snapshots_object_key_key/);
  });
});
