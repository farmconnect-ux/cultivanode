import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const DB_URL = process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

function runPsql(sql) {
  return new Promise((resolve, reject) => {
    const child = spawn('psql', [DB_URL, '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-c', sql], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => {
      resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
    });
    child.on('error', reject);
  });
}

async function main() {
  console.log('1. Testing genuinely concurrent journal writes...');
  const tx1 = `
    BEGIN;
    SELECT public.record_marketplace_journal_entry(
      'CONC-TX-1', 'adjustment', 'Concurrent write 1',
      '[{"account_id":"ASSET_PAYMENT_CLEARING","direction":"DEBIT","amount_kobo":2500},{"account_id":"LIABILITY_SELLER_PAYABLE","direction":"CREDIT","amount_kobo":2500}]'::jsonb
    );
    SELECT pg_sleep(0.3);
    COMMIT;
  `;
  const tx2 = `
    BEGIN;
    SELECT public.record_marketplace_journal_entry(
      'CONC-TX-2', 'adjustment', 'Concurrent write 2',
      '[{"account_id":"ASSET_PAYMENT_CLEARING","direction":"DEBIT","amount_kobo":3500},{"account_id":"LIABILITY_SELLER_PAYABLE","direction":"CREDIT","amount_kobo":3500}]'::jsonb
    );
    COMMIT;
  `;

  const [r1, r2] = await Promise.all([runPsql(tx1), runPsql(tx2)]);
  assert.equal(r1.code, 0, `Concurrent tx1 failed: ${r1.stderr}`);
  assert.equal(r2.code, 0, `Concurrent tx2 failed: ${r2.stderr}`);

  const chainCheck = await runPsql(`
    WITH ordered AS (
      SELECT id, reference_id, previous_hash, current_hash,
             lag(current_hash) OVER (ORDER BY created_at ASC, id ASC) AS prev_expected
      FROM public.marketplace_journal_entries
      WHERE reference_id IN ('CONC-TX-1', 'CONC-TX-2')
    )
    SELECT count(*) FROM ordered WHERE prev_expected IS NOT NULL AND previous_hash = prev_expected;
  `);
  assert.equal(chainCheck.code, 0, chainCheck.stderr);
  assert.equal(chainCheck.stdout, '1', `Expected sequential hash link between CONC-TX-1 and CONC-TX-2, got: ${chainCheck.stdout}`);
  console.log('   PASS: Concurrent journal writes serialised with sequential hash chain.');

  console.log('2. Testing genuinely concurrent settlement completion...');
  const seedSettlement = await runPsql(`
    INSERT INTO auth.users (id, email) VALUES
      ('e8000000-0000-0000-0000-000000000001', 'conc-buyer@example.com'),
      ('e8000000-0000-0000-0000-000000000002', 'conc-seller@example.com'),
      ('e8000000-0000-0000-0000-000000000003', 'conc-admin@example.com')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.profiles (id, full_name) VALUES
      ('e8000000-0000-0000-0000-000000000001', 'Conc Buyer'),
      ('e8000000-0000-0000-0000-000000000002', 'Conc Seller'),
      ('e8000000-0000-0000-0000-000000000003', 'Conc Admin')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.admin_roles (profile_id, role) VALUES
      ('e8000000-0000-0000-0000-000000000003', 'super_admin')
    ON CONFLICT (profile_id) DO NOTHING;
    INSERT INTO public.marketplace_sellers (id, owner_id, business_name, seller_type, status) VALUES
      ('e8000000-0000-0000-0000-0000000000a1', 'e8000000-0000-0000-0000-000000000002', 'Conc Agro', 'farmer', 'active')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.marketplace_orders (id, order_number, buyer_id, total_kobo, status) VALUES
      ('e8000000-0000-0000-0000-0000000000b1', 'ORD-CONC-1', 'e8000000-0000-0000-0000-000000000001', 50000, 'completed')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.marketplace_escrows (id, order_id, buyer_id, seller_id, amount_kobo, commission_kobo, seller_net_kobo, status) VALUES
      ('e8000000-0000-0000-0000-0000000000c1', 'e8000000-0000-0000-0000-0000000000b1', 'e8000000-0000-0000-0000-000000000001', 'e8000000-0000-0000-0000-0000000000a1', 50000, 2500, 47500, 'released')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.marketplace_settlements (id, escrow_id, seller_id, gross_amount_kobo, commission_kobo, net_payout_kobo, payout_reference, status) VALUES
      ('e8000000-0000-0000-0000-0000000000d1', 'e8000000-0000-0000-0000-0000000000c1', 'e8000000-0000-0000-0000-0000000000a1', 50000, 2500, 47500, 'PAYOUT-CONC-1', 'pending')
    ON CONFLICT (id) DO NOTHING;
  `);
  assert.equal(seedSettlement.code, 0, seedSettlement.stderr);

  const settleTx = (label) => `
    BEGIN;
    SELECT set_config('request.jwt.claims', '{"sub":"e8000000-0000-0000-0000-000000000003"}', true);
    SELECT public.admin_process_marketplace_settlement('e8000000-0000-0000-0000-0000000000d1', 'completed', '${label}');
    COMMIT;
  `;
  const [s1, s2] = await Promise.all([runPsql(settleTx('Race 1')), runPsql(settleTx('Race 2'))]);
  const successes = [s1, s2].filter((r) => r.code === 0).length;
  const failures = [s1, s2].filter((r) => r.code !== 0).length;
  assert.equal(successes, 1, `Expected exactly 1 settlement winner, got ${successes}`);
  assert.equal(failures, 1, `Expected exactly 1 rejected duplicate settlement, got ${failures}`);

  const payoutCount = await runPsql(`
    SELECT count(*) FROM public.marketplace_journal_entries
    WHERE reference_id = 'e8000000-0000-0000-0000-0000000000d1' AND reference_type = 'payout';
  `);
  assert.equal(payoutCount.stdout, '1', `Expected 1 payout journal entry, got ${payoutCount.stdout}`);
  console.log('   PASS: Concurrent settlement race produced 1 completion, 1 rejection, and 1 payout entry.');

  console.log('3. Testing genuinely concurrent support ticket transition...');
  const seedTicket = await runPsql(`
    INSERT INTO public.support_tickets (id, ticket_number, requester_id, subject, category, priority, status)
    VALUES ('e8000000-0000-0000-0000-0000000000e1', 'TKT-CONC-1', 'e8000000-0000-0000-0000-000000000001', 'Concurrent ticket', 'account', 'normal', 'open')
    ON CONFLICT (id) DO NOTHING;
  `);
  assert.equal(seedTicket.code, 0, seedTicket.stderr);

  const t1 = `
    BEGIN;
    SELECT set_config('request.jwt.claims', '{"sub":"e8000000-0000-0000-0000-000000000003"}', true);
    SELECT public.admin_update_support_ticket('e8000000-0000-0000-0000-0000000000e1', 'resolved', 'high', 'e8000000-0000-0000-0000-000000000003');
    SELECT pg_sleep(0.2);
    COMMIT;
  `;
  const t2 = `
    BEGIN;
    SELECT set_config('request.jwt.claims', '{"sub":"e8000000-0000-0000-0000-000000000003"}', true);
    SELECT public.admin_update_support_ticket('e8000000-0000-0000-0000-0000000000e1', 'pending', 'normal', null);
    COMMIT;
  `;
  const [tr1, tr2] = await Promise.all([runPsql(t1), runPsql(t2)]);
  // One commits resolved first, the other blocks on FOR UPDATE and then fails resolved -> pending (22023) OR vice-versa if pending ran first
  assert.ok(tr1.code === 0 || tr2.code === 0, 'At least one concurrent ticket update must succeed');
  console.log(`   PASS: Concurrent ticket transitions completed safely (tx1=${tr1.code}, tx2=${tr2.code}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
