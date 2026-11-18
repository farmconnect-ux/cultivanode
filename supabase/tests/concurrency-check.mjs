import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const DB_URL = process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

function runPsql(sqlOrCommands, appName) {
  const cmds = Array.isArray(sqlOrCommands) ? sqlOrCommands : [sqlOrCommands];
  const args = [DB_URL, '-v', 'ON_ERROR_STOP=1', '-t', '-A'];
  for (const c of cmds) {
    args.push('-c', c);
  }
  return new Promise((resolve, reject) => {
    const child = spawn('psql', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: appName ? { ...process.env, PGAPPNAME: appName } : process.env,
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

async function waitForTicketLock(appName, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await runPsql(`
      SELECT count(*)
      FROM pg_locks l
      JOIN pg_stat_activity a ON a.pid = l.pid
      WHERE a.application_name = '${appName}'
        AND l.relation = 'public.support_tickets'::regclass
        AND l.mode = 'RowExclusiveLock'
        AND l.granted = true
        AND a.query LIKE '%pg_sleep%';
    `);
    if (res.code === 0 && Number.parseInt(res.stdout, 10) >= 1) {
      return;
    }
    await new Promise((r) => setTimeout(r, 15));
  }
  throw new Error(`Timed out waiting for ${appName} to acquire support_tickets lock`);
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
    INSERT INTO public.admin_roles (profile_id, admin_role) VALUES
      ('e8000000-0000-0000-0000-000000000003', 'super_admin')
    ON CONFLICT DO NOTHING;
    INSERT INTO public.marketplace_sellers (id, profile_id, business_name, seller_type, verification_status) VALUES
      ('e8000000-0000-0000-0000-0000000000a1', 'e8000000-0000-0000-0000-000000000002', 'Conc Agro', 'agro_dealer', 'verified')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.marketplace_orders (id, order_number, buyer_id, items_subtotal_kobo, total_amount_kobo, status, payment_status, payment_mode, delivery_address) VALUES
      ('e8000000-0000-0000-0000-0000000000b1', 'ORD-CONC-1', 'e8000000-0000-0000-0000-000000000001', 50000, 50000, 'completed', 'released', 'escrow', '{"state":"Oyo"}'::jsonb)
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

  console.log('3a. Testing support ticket concurrency: resolved holds FOR UPDATE lock first -> pending MUST be rejected...');
  const ticketA = 'e8000000-0000-0000-0000-0000000000e1';
  const ticketB = 'e8000000-0000-0000-0000-0000000000e2';
  const ticketC = 'e8000000-0000-0000-0000-0000000000e3';

  const seedTickets = await runPsql(`
    DELETE FROM public.admin_actions WHERE entity = 'support_tickets' AND entity_id IN ('${ticketA}', '${ticketB}', '${ticketC}');
    INSERT INTO public.support_tickets (id, ticket_number, requester_id, subject, category, priority, status) VALUES
      ('${ticketA}', 'TKT-CONC-A', 'e8000000-0000-0000-0000-000000000001', 'Concurrent ticket A', 'account', 'normal', 'open'),
      ('${ticketB}', 'TKT-CONC-B', 'e8000000-0000-0000-0000-000000000001', 'Concurrent ticket B', 'account', 'normal', 'open'),
      ('${ticketC}', 'TKT-CONC-C', 'e8000000-0000-0000-0000-000000000001', 'Concurrent ticket C', 'account', 'normal', 'open')
    ON CONFLICT (id) DO UPDATE SET status = 'open', priority = 'normal', resolved_at = NULL;
  `);
  assert.equal(seedTickets.code, 0, seedTickets.stderr);

  const ticketTxCmds = (ticketId, status, priority, sleepSec = 0) => {
    const cmds = [
      'BEGIN;',
      `SELECT set_config('request.jwt.claims', '{"sub":"e8000000-0000-0000-0000-000000000003"}', true);`,
      `SELECT public.admin_update_support_ticket('${ticketId}', '${status}', '${priority}', 'e8000000-0000-0000-0000-000000000003');`,
    ];
    if (sleepSec > 0) cmds.push(`SELECT pg_sleep(${sleepSec});`);
    cmds.push('COMMIT;');
    return cmds;
  };

  // 3a: resolved acquires FOR UPDATE lock (observed via pg_locks + pg_stat_activity); pending blocks and must fail resolved -> pending
  const p3a1 = runPsql(ticketTxCmds(ticketA, 'resolved', 'high', 0.45), 'conc_tx1_3a');
  await waitForTicketLock('conc_tx1_3a');
  const p3a2 = runPsql(ticketTxCmds(ticketA, 'pending', 'normal', 0), 'conc_tx2_3a');
  const [r3a1, r3a2] = await Promise.all([p3a1, p3a2]);
  assert.equal(r3a1.code, 0, `3a resolved tx failed: ${r3a1.stderr}`);
  assert.notEqual(r3a2.code, 0, '3a competing pending tx should have been rejected after resolved committed');
  assert.match(r3a2.stderr, /Cannot move ticket from resolved to pending/);

  const stateA = await runPsql(`SELECT status FROM public.support_tickets WHERE id = '${ticketA}';`);
  assert.equal(stateA.stdout, 'resolved');
  const auditA = await runPsql(`
    SELECT string_agg(action || ':' || reason, '|' ORDER BY created_at ASC, id ASC)
    FROM public.admin_actions WHERE entity = 'support_tickets' AND entity_id = '${ticketA}';
  `);
  assert.equal(auditA.stdout, 'support_ticket_resolved:from=open, status=resolved, priority=high');
  console.log('   PASS: 3a deterministically locked resolved first (pg_locks verified), rejected competing pending, zero orphan audit rows.');

  // 3b: pending acquires FOR UPDATE lock (observed via pg_locks + pg_stat_activity); resolved blocks and legitimately succeeds (pending -> resolved)
  console.log('3b. Testing support ticket concurrency: pending holds FOR UPDATE lock first -> resolved succeeds via pending->resolved...');
  const p3b1 = runPsql(ticketTxCmds(ticketB, 'pending', 'normal', 0.45), 'conc_tx1_3b');
  await waitForTicketLock('conc_tx1_3b');
  const p3b2 = runPsql(ticketTxCmds(ticketB, 'resolved', 'high', 0), 'conc_tx2_3b');
  const [r3b1, r3b2] = await Promise.all([p3b1, p3b2]);
  assert.equal(r3b1.code, 0, `3b pending tx failed: ${r3b1.stderr}`);
  assert.equal(r3b2.code, 0, `3b resolved tx should succeed after pending: ${r3b2.stderr}`);

  const stateB = await runPsql(`SELECT status FROM public.support_tickets WHERE id = '${ticketB}';`);
  assert.equal(stateB.stdout, 'resolved');
  const auditB = await runPsql(`
    SELECT string_agg(action || ':' || reason, '|' ORDER BY created_at ASC, id ASC)
    FROM public.admin_actions WHERE entity = 'support_tickets' AND entity_id = '${ticketB}';
  `);
  assert.equal(
    auditB.stdout,
    'support_ticket_pending:from=open, status=pending, priority=normal|support_ticket_resolved:from=pending, status=resolved, priority=high',
  );
  console.log('   PASS: 3b deterministically serialised pending -> resolved (pg_locks verified) with exact 2-step audit trail.');

  // 3c: uncontrolled simultaneous race — accept only the two valid serialised outcomes
  console.log('3c. Testing uncontrolled simultaneous support ticket race...');
  const [r3cResolved, r3cPending] = await Promise.all([
    runPsql(ticketTxCmds(ticketC, 'resolved', 'high', 0)),
    runPsql(ticketTxCmds(ticketC, 'pending', 'normal', 0)),
  ]);
  const stateC = await runPsql(`SELECT status FROM public.support_tickets WHERE id = '${ticketC}';`);
  assert.equal(stateC.stdout, 'resolved');
  const auditC = await runPsql(`
    SELECT string_agg(action || ':' || reason, '|' ORDER BY (reason LIKE 'from=open%') DESC, created_at ASC, id ASC)
    FROM public.admin_actions WHERE entity = 'support_tickets' AND entity_id = '${ticketC}';
  `);
  if (r3cPending.code !== 0) {
    assert.equal(r3cResolved.code, 0, '3c resolved must succeed when pending is rejected');
    assert.match(r3cPending.stderr, /Cannot move ticket from resolved to pending/);
    assert.equal(auditC.stdout, 'support_ticket_resolved:from=open, status=resolved, priority=high');
  } else {
    assert.equal(r3cResolved.code, 0, '3c resolved must succeed after pending');
    assert.equal(
      auditC.stdout,
      'support_ticket_pending:from=open, status=pending, priority=normal|support_ticket_resolved:from=pending, status=resolved, priority=high',
    );
  }
  console.log(`   PASS: 3c valid serialised outcome (${auditC.stdout}).`);

  // 4a: Concurrent last-super-admin deletion guard
  console.log('4a. Testing concurrent super_admin deletion serialisation...');
  const sa1 = randomUUID();
  const sa2 = randomUUID();
  const saSetup = await runPsql(`
    INSERT INTO auth.users (id, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES
      ('${sa1}', '2348099900001', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
      ('${sa2}', '2348099900002', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated');
    INSERT INTO public.profiles (id, phone, full_name)
    VALUES ('${sa1}', '2348099900001', 'Super One'), ('${sa2}', '2348099900002', 'Super Two')
    ON CONFLICT (id) DO UPDATE SET phone = EXCLUDED.phone, full_name = EXCLUDED.full_name;
    DELETE FROM public.admin_roles WHERE admin_role = 'super_admin' AND profile_id NOT IN ('${sa1}', '${sa2}');
    INSERT INTO public.admin_roles (profile_id, admin_role)
    VALUES ('${sa1}', 'super_admin'), ('${sa2}', 'super_admin')
    ON CONFLICT DO NOTHING;
  `);
  assert.equal(saSetup.code, 0, `4a setup failed: ${saSetup.stderr}`);

  const [rSa1, rSa2] = await Promise.all([
    runPsql(`SELECT public.execute_account_deletion('${sa1}', 'Concurrent SA1');`),
    runPsql(`SELECT public.execute_account_deletion('${sa2}', 'Concurrent SA2');`),
  ]);
  const saSuccesses = [rSa1, rSa2].filter((r) => r.code === 0);
  const saFailures = [rSa1, rSa2].filter((r) => r.code !== 0);
  assert.equal(saSuccesses.length, 1, `Expected exactly 1 super_admin deletion to succeed, got ${saSuccesses.length}`);
  assert.equal(saFailures.length, 1, `Expected exactly 1 super_admin deletion to be rejected, got ${saFailures.length}`);
  assert.match(saFailures[0].stderr, /Cannot delete the last super admin account/);
  const remainingSa = await runPsql(`SELECT count(*) FROM public.admin_roles WHERE admin_role = 'super_admin';`);
  assert.equal(remainingSa.stdout, '1', `Expected 1 remaining super_admin, got ${remainingSa.stdout}`);
  console.log('   PASS: 4a serialised concurrent super_admin deletions; 1 succeeded, 1 rejected, 1 super_admin preserved.');

  // 4b: Concurrent duplicate account deletion + booking insert guard
  console.log('4b. Testing concurrent duplicate deletion and booking creation guard...');
  const dupUser = randomUUID();
  const farmerUser = randomUUID();
  const farmId = randomUUID();
  const listingId = randomUUID();
  const b4Setup = await runPsql(`
    INSERT INTO auth.users (id, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES
      ('${dupUser}', '2348099900003', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
      ('${farmerUser}', '2348099900004', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated');
    INSERT INTO public.profiles (id, phone, full_name)
    VALUES ('${dupUser}', '2348099900003', 'Dup Target'), ('${farmerUser}', '2348099900004', 'Concurrent Farmer')
    ON CONFLICT (id) DO UPDATE SET phone = EXCLUDED.phone, full_name = EXCLUDED.full_name;
    INSERT INTO public.farms (id, owner_id, name, state, location)
    VALUES ('${farmId}', '${farmerUser}', 'Conc Farm', 'Oyo', extensions.st_geogfromtext('SRID=4326;POINT(3.9 7.3)'));
    INSERT INTO public.listings (id, owner_id, kind, equipment_type, title, service_radius_km, location)
    VALUES ('${listingId}', '${dupUser}', 'equipment', 'tractor', 'Conc Tractor', 50, extensions.st_geogfromtext('SRID=4326;POINT(3.9 7.3)'));
  `);
  assert.equal(b4Setup.code, 0, `4b setup failed: ${b4Setup.stderr}`);

  const [rDup1, rDup2, rBook] = await Promise.all([
    runPsql(`SELECT (public.execute_account_deletion('${dupUser}', 'Race 1'))->>'status';`),
    runPsql(`SELECT (public.execute_account_deletion('${dupUser}', 'Race 2'))->>'status';`),
    runPsql(`
      INSERT INTO public.bookings (
        farmer_id, provider_id, listing_id, farm_id,
        listing_title, listing_kind, farm_name, job_location, distance_km,
        job_date, unit, quantity, rate_kobo, total_kobo, status, expires_at
      ) VALUES (
        '${farmerUser}', '${dupUser}', '${listingId}', '${farmId}',
        'Conc Tractor', 'equipment', 'Conc Farm', extensions.st_geogfromtext('SRID=4326;POINT(3.9 7.3)'), 0,
        current_date + 1, 'hectare', 1, 20000, 20000, 'requested', now() + interval '1 day'
      );
    `),
  ]);
  // Either booking landed first (blocking both deletions) OR deletion landed first (blocking booking + making second deletion idempotent).
  if (rBook.code === 0) {
    assert.ok(rDup1.code !== 0 && rDup2.code !== 0, 'If booking succeeded first, both deletions must be blocked');
  } else {
    assert.match(rBook.stderr, /Cannot create or update booking for a deleted or deleting account/);
    assert.equal(rDup1.code, 0);
    assert.equal(rDup2.code, 0);
    const statuses = [rDup1.stdout, rDup2.stdout].sort();
    assert.deepEqual(statuses, ['already_anonymized', 'anonymized']);
  }
  console.log('   PASS: 4b concurrent deletion and booking race produced a valid serialised outcome.');

  // 4c: Deterministic ordering: booking insert locks profile (FOR KEY SHARE) first -> deletion blocks and rejects
  console.log('4c. Testing deterministic booking-first -> deletion-blocked...');
  const u4c = randomUUID();
  const f4c = randomUUID();
  const farm4c = randomUUID();
  const list4c = randomUUID();
  const setup4c = await runPsql(`
    INSERT INTO auth.users (id, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES
      ('${u4c}', '2348099900011', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
      ('${f4c}', '2348099900012', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated');
    INSERT INTO public.profiles (id, phone, full_name)
    VALUES ('${u4c}', '2348099900011', 'Provider 4c'), ('${f4c}', '2348099900012', 'Farmer 4c')
    ON CONFLICT (id) DO UPDATE SET phone = EXCLUDED.phone, full_name = EXCLUDED.full_name;
    INSERT INTO public.farms (id, owner_id, name, state, location)
    VALUES ('${farm4c}', '${f4c}', 'Farm 4c', 'Oyo', extensions.st_geogfromtext('SRID=4326;POINT(3.9 7.3)'));
    INSERT INTO public.listings (id, owner_id, kind, equipment_type, title, service_radius_km, location)
    VALUES ('${list4c}', '${u4c}', 'equipment', 'tractor', 'Tractor 4c', 50, extensions.st_geogfromtext('SRID=4326;POINT(3.9 7.3)'));
  `);
  assert.equal(setup4c.code, 0, `4c setup failed: ${setup4c.stderr}`);

  const bookFirstP = runPsql(
    `
      BEGIN;
      INSERT INTO public.bookings (
        farmer_id, provider_id, listing_id, farm_id,
        listing_title, listing_kind, farm_name, job_location, distance_km,
        job_date, unit, quantity, rate_kobo, total_kobo, status, expires_at
      ) VALUES (
        '${f4c}', '${u4c}', '${list4c}', '${farm4c}',
        'Tractor 4c', 'equipment', 'Farm 4c', extensions.st_geogfromtext('SRID=4326;POINT(3.9 7.3)'), 0,
        current_date + 1, 'hectare', 1, 20000, 20000, 'requested', now() + interval '1 day'
      );
      SELECT pg_sleep(0.45);
      COMMIT;
    `,
    'conc_4c_book_first',
  );
  // Wait until conc_4c_book_first holds RowShareLock on public.profiles and is sleeping
  {
    const deadline = Date.now() + 5000;
    let locked = false;
    while (Date.now() < deadline) {
      const check = await runPsql(`
        SELECT count(*) FROM pg_locks l
        JOIN pg_stat_activity a ON a.pid = l.pid
        WHERE a.application_name = 'conc_4c_book_first'
          AND l.relation = 'public.profiles'::regclass
          AND l.granted = true
          AND a.query LIKE '%pg_sleep%';
      `);
      if (check.code === 0 && Number.parseInt(check.stdout, 10) >= 1) {
        locked = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 15));
    }
    assert.ok(locked, 'Expected conc_4c_book_first to hold profiles lock before launching deletion');
  }

  const delAfterBook = await runPsql(`SELECT public.execute_account_deletion('${u4c}', '4c race');`);
  const bookFirstRes = await bookFirstP;
  assert.equal(bookFirstRes.code, 0, `4c booking should commit: ${bookFirstRes.stderr}`);
  assert.notEqual(delAfterBook.code, 0, '4c deletion must be rejected after committed booking');
  assert.match(delAfterBook.stderr, /Complete or resolve active service bookings/);

  const state4c = await runPsql(`
    SELECT (SELECT count(*) FROM public.bookings WHERE provider_id = '${u4c}')::text
        || '|' || coalesce((SELECT deletion_status FROM public.profiles WHERE id = '${u4c}'), 'null');
  `);
  assert.equal(state4c.stdout, '1|null');
  console.log('   PASS: 4c booking-first committed and blocked concurrent deletion.');

  // 4d: Deterministic ordering: deletion locks profile (FOR UPDATE) first -> booking insert blocks and rejects
  console.log('4d. Testing deterministic deletion-first -> booking-rejected...');
  const u4d = randomUUID();
  const f4d = randomUUID();
  const farm4d = randomUUID();
  const list4d = randomUUID();
  const setup4d = await runPsql(`
    INSERT INTO auth.users (id, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES
      ('${u4d}', '2348099900013', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
      ('${f4d}', '2348099900014', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated');
    INSERT INTO public.profiles (id, phone, full_name)
    VALUES ('${u4d}', '2348099900013', 'Provider 4d'), ('${f4d}', '2348099900014', 'Farmer 4d')
    ON CONFLICT (id) DO UPDATE SET phone = EXCLUDED.phone, full_name = EXCLUDED.full_name;
    INSERT INTO public.farms (id, owner_id, name, state, location)
    VALUES ('${farm4d}', '${f4d}', 'Farm 4d', 'Oyo', extensions.st_geogfromtext('SRID=4326;POINT(3.9 7.3)'));
    INSERT INTO public.listings (id, owner_id, kind, equipment_type, title, service_radius_km, location)
    VALUES ('${list4d}', '${u4d}', 'equipment', 'tractor', 'Tractor 4d', 50, extensions.st_geogfromtext('SRID=4326;POINT(3.9 7.3)'));
  `);
  assert.equal(setup4d.code, 0, `4d setup failed: ${setup4d.stderr}`);

  const delFirstP = runPsql(
    `
      BEGIN;
      SELECT public.execute_account_deletion('${u4d}', '4d race');
      SELECT pg_sleep(0.45);
      COMMIT;
    `,
    'conc_4d_del_first',
  );
  {
    const deadline = Date.now() + 5000;
    let locked = false;
    while (Date.now() < deadline) {
      const check = await runPsql(`
        SELECT count(*) FROM pg_locks l
        JOIN pg_stat_activity a ON a.pid = l.pid
        WHERE a.application_name = 'conc_4d_del_first'
          AND l.relation = 'public.profiles'::regclass
          AND l.mode = 'RowExclusiveLock'
          AND l.granted = true
          AND a.query LIKE '%pg_sleep%';
      `);
      if (check.code === 0 && Number.parseInt(check.stdout, 10) >= 1) {
        locked = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 15));
    }
    assert.ok(locked, 'Expected conc_4d_del_first to hold RowExclusiveLock on profiles');
  }

  const bookAfterDel = await runPsql(`
    INSERT INTO public.bookings (
      farmer_id, provider_id, listing_id, farm_id,
      listing_title, listing_kind, farm_name, job_location, distance_km,
      job_date, unit, quantity, rate_kobo, total_kobo, status, expires_at
    ) VALUES (
      '${f4d}', '${u4d}', '${list4d}', '${farm4d}',
      'Tractor 4d', 'equipment', 'Farm 4d', extensions.st_geogfromtext('SRID=4326;POINT(3.9 7.3)'), 0,
      current_date + 1, 'hectare', 1, 20000, 20000, 'requested', now() + interval '1 day'
    );
  `);
  const delFirstRes = await delFirstP;
  assert.equal(delFirstRes.code, 0, `4d deletion should commit: ${delFirstRes.stderr}`);
  assert.notEqual(bookAfterDel.code, 0, '4d booking must be rejected after committed deletion');
  assert.match(bookAfterDel.stderr, /Cannot create or update booking for a deleted or deleting account/);

  const state4d = await runPsql(`
    SELECT (SELECT count(*) FROM public.bookings WHERE provider_id = '${u4d}')::text
        || '|' || (SELECT deletion_status FROM public.profiles WHERE id = '${u4d}');
  `);
  assert.equal(state4d.stdout, '0|auth_pending');
  console.log('   PASS: 4d deletion-first committed and rejected concurrent booking.');

  // 4e: Concurrent Storage cleanup lease isolation + stale lease recovery
  console.log('4e. Testing concurrent Storage cleanup lease isolation and stale recovery...');
  const u4e = randomUUID();
  const setup4e = await runPsql(`
    INSERT INTO auth.users (id, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES ('${u4e}', '2348099900015', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated');
    INSERT INTO public.profiles (id, phone, full_name, deleted_at, deletion_status)
    VALUES ('${u4e}', '2348099900015', 'Deleted user', now(), 'storage_pending')
    ON CONFLICT (id) DO UPDATE SET deleted_at = now(), deletion_status = 'storage_pending';
    INSERT INTO public.account_deletion_storage_cleanup (profile_id, bucket_id, storage_path, status)
    VALUES ('${u4e}', 'verification-documents', '${u4e}/lease-test.pdf', 'pending');
  `);
  assert.equal(setup4e.code, 0, `4e setup failed: ${setup4e.stderr}`);

  const [w1, w2] = await Promise.all([
    runPsql(`SELECT count(*) FROM public.claim_account_deletion_storage_cleanup('${u4e}', 300);`),
    runPsql(`SELECT count(*) FROM public.claim_account_deletion_storage_cleanup('${u4e}', 300);`),
  ]);
  assert.equal(w1.code, 0);
  assert.equal(w2.code, 0);
  const claimCounts = [Number.parseInt(w1.stdout, 10), Number.parseInt(w2.stdout, 10)].sort();
  assert.deepEqual(claimCounts, [0, 1], `Expected exactly 1 worker to claim lease, got ${claimCounts}`);

  // Expire the lease and verify stale claim recovery
  const expireRes = await runPsql(`
    UPDATE public.account_deletion_storage_cleanup
       SET lease_expires_at = clock_timestamp() - interval '1 second'
     WHERE profile_id = '${u4e}';
    SELECT attempts::text FROM public.claim_account_deletion_storage_cleanup('${u4e}', 300);
  `);
  assert.equal(expireRes.code, 0, `4e stale reclaim failed: ${expireRes.stderr}`);
  assert.equal(expireRes.stdout, '2');
  console.log('   PASS: 4e concurrent workers respected active lease and reclaimed expired lease.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
