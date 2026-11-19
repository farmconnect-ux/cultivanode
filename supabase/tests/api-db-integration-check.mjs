import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const API_URL = process.env.API_URL ?? process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON_KEY = process.env.ANON_KEY ?? '';
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY ?? '';
const DB_URL = process.env.DB_URL ?? process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

assert.ok(ANON_KEY, 'ANON_KEY must be set');
assert.ok(SERVICE_ROLE_KEY, 'SERVICE_ROLE_KEY must be set');

function runPsql(sql) {
  const res = spawnSync('psql', [DB_URL, '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-c', sql], {
    encoding: 'utf8',
  });
  if (res.status !== 0) {
    throw new Error(`psql failed: ${res.stderr || res.stdout}`);
  }
  return res.stdout.trim();
}

async function createAndSignInUser(email, password) {
  const createRes = await fetch(`${API_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const created = await createRes.json();
  assert.ok(createRes.ok && created.id, `Failed creating user ${email}: ${JSON.stringify(created)}`);

  const loginRes = await fetch(`${API_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const login = await loginRes.json();
  assert.ok(loginRes.ok && login.access_token, `Failed signing in ${email}: ${JSON.stringify(login)}`);
  return { id: created.id, token: login.access_token };
}

async function deleteUser(userId) {
  await fetch(`${API_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
  }).catch(() => undefined);
}

async function rpcCall(token, fn, body = {}) {
  return fetch(`${API_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: token === SERVICE_ROLE_KEY ? SERVICE_ROLE_KEY : ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const createdUsers = [];
  const ticketId = randomUUID();
  const ledgerRef = `B23-INT-${suffix}`;
  const delModelId = randomUUID();
  const delDeviceId = randomUUID();
  const delCmdId = randomUUID();

  try {
    const user = await createAndSignInUser(`b23-user-${suffix}@example.com`, 'TestPass!123');
    createdUsers.push(user.id);
    const outsider = await createAndSignInUser(`b23-outsider-${suffix}@example.com`, 'TestPass!123');
    createdUsers.push(outsider.id);
    const staff = await createAndSignInUser(`b23-staff-${suffix}@example.com`, 'TestPass!123');
    createdUsers.push(staff.id);

    runPsql(`
      INSERT INTO public.admin_roles (profile_id, admin_role)
      VALUES ('${staff.id}', 'super_admin')
      ON CONFLICT DO NOTHING;
    `);

    // 1. Ledger Transact RPC (real DB persistence via PostgREST service_role)
    console.log('1. Testing /api/engines/ledger/transact backing RPC against live Postgres...');
    const badLedger = await rpcCall(SERVICE_ROLE_KEY, 'record_marketplace_journal_entry', {
      p_reference_id: ledgerRef,
      p_reference_type: 'adjustment',
      p_description: 'Unbalanced test',
      p_postings: [
        { account_id: 'ASSET_PAYMENT_CLEARING', direction: 'DEBIT', amount_kobo: 1000 },
        { account_id: 'LIABILITY_SELLER_PAYABLE', direction: 'CREDIT', amount_kobo: 500 },
      ],
    });
    assert.ok(!badLedger.ok, `Expected unbalanced ledger entry to fail, got ${badLedger.status}`);

    const okLedger = await rpcCall(SERVICE_ROLE_KEY, 'record_marketplace_journal_entry', {
      p_reference_id: ledgerRef,
      p_reference_type: 'adjustment',
      p_description: 'Batch 02.3 integration test adjustment',
      p_postings: [
        { account_id: 'ASSET_PAYMENT_CLEARING', direction: 'DEBIT', amount_kobo: 2000 },
        { account_id: 'LIABILITY_SELLER_PAYABLE', direction: 'CREDIT', amount_kobo: 2000 },
      ],
    });
    assert.equal(okLedger.status, 200, `Expected 200 from ledger RPC, got ${await okLedger.text()}`);
    console.log('   PASS: record_marketplace_journal_entry rejected unbalanced and persisted valid entry.');

    // 2. Admin Finance RPC regression via PostgREST HTTP
    console.log('2. Testing Admin Finance RPCs via PostgREST HTTP (auth vs unauthorised)...');
    const unauthFin = await rpcCall(user.token, 'admin_finance_summary');
    assert.equal(unauthFin.status, 403, `Expected 403 for ordinary user on admin_finance_summary, got ${unauthFin.status}`);

    const authFin = await rpcCall(staff.token, 'admin_finance_summary');
    assert.equal(authFin.status, 200, `Expected 200 for staff on admin_finance_summary, got ${authFin.status}`);
    const finJson = await authFin.json();
    assert.ok(Array.isArray(finJson.accounts) && finJson.accounts.length >= 7, 'Expected seeded ledger accounts');

    const pagedJe = await rpcCall(staff.token, 'admin_finance_journal_entries', {
      p_q: ledgerRef,
      p_limit: 25,
      p_offset: 0,
    });
    assert.equal(pagedJe.status, 200);
    const jeJson = await pagedJe.json();
    assert.equal(Number(jeJson.total_count), 1);
    console.log('   PASS: Admin Finance RPCs enforced permissions and returned persisted ledger data.');

    // 3. Admin Support RPC + User Ticket Thread RLS Isolation via PostgREST HTTP
    console.log('3. Testing Admin Support RPCs and internal-note RLS isolation via PostgREST HTTP...');
    runPsql(`
      INSERT INTO public.support_tickets (id, ticket_number, requester_id, subject, category, priority, status)
      VALUES ('${ticketId}', 'TKT-B23-${suffix}', '${user.id}', 'Batch 02.3 live test', 'account', 'normal', 'open');
    `);

    const updRes = await rpcCall(staff.token, 'admin_update_support_ticket', {
      p_ticket_id: ticketId,
      p_status: 'in_progress',
      p_priority: 'high',
      p_assigned_to: staff.id,
    });
    assert.equal(updRes.status, 200, `Support update failed: ${await updRes.text()}`);

    const pubMsgRes = await rpcCall(staff.token, 'admin_post_support_message', {
      p_ticket_id: ticketId,
      p_body: 'Public reply for requester',
      p_is_internal: false,
    });
    assert.equal(pubMsgRes.status, 200);

    const intMsgRes = await rpcCall(staff.token, 'admin_post_support_message', {
      p_ticket_id: ticketId,
      p_body: 'Secret staff triage note',
      p_is_internal: true,
    });
    assert.equal(intMsgRes.status, 200);

    const userMsgsRes = await fetch(
      `${API_URL}/rest/v1/support_ticket_messages?ticket_id=eq.${ticketId}&select=body,is_internal`,
      { headers: { Authorization: `Bearer ${user.token}`, apikey: ANON_KEY } },
    );
    assert.equal(userMsgsRes.status, 200);
    const userMsgs = await userMsgsRes.json();
    assert.equal(userMsgs.length, 1, `Requester should see only 1 public message, saw ${JSON.stringify(userMsgs)}`);
    assert.equal(userMsgs[0].body, 'Public reply for requester');

    const outsiderMsgsRes = await fetch(
      `${API_URL}/rest/v1/support_ticket_messages?ticket_id=eq.${ticketId}&select=body`,
      { headers: { Authorization: `Bearer ${outsider.token}`, apikey: ANON_KEY } },
    );
    assert.equal(outsiderMsgsRes.status, 200);
    assert.deepEqual(await outsiderMsgsRes.json(), [], 'Outsider must see 0 messages');
    console.log('   PASS: Support ticket transition, audit, public reply, and internal-note isolation verified via HTTP.');

    // 4. NDPA Account Export RPC (backing /api/account/export)
    console.log('4. Testing export_my_data RPC via PostgREST HTTP...');
    const exportRes = await rpcCall(user.token, 'export_my_data');
    assert.equal(exportRes.status, 200, `export_my_data failed: ${exportRes.status}`);
    const exportJson = await exportRes.json();
    assert.ok(exportJson && typeof exportJson === 'object', 'Expected NDPA export JSON object');
    console.log('   PASS: export_my_data returned user data over PostgREST.');

    // 5. Payment Webhook Settlement RPC (backing /api/webhooks/paystack & /api/webhooks/flutterwave)
    console.log('5. Testing process_payment_webhook RPC against live Postgres...');
    const unknownOrderRes = await rpcCall(SERVICE_ROLE_KEY, 'process_payment_webhook', {
      p_reference: `PSTK-MISSING-${suffix}`,
      p_provider: 'paystack',
      p_amount_kobo: 50000,
      p_order_id: randomUUID(),
      p_gateway_data: {},
    });
    assert.ok(!unknownOrderRes.ok, `Expected unknown order to fail, got ${unknownOrderRes.status}`);

    const whSellerId = randomUUID();
    const whCatId = randomUUID();
    const whListingId = randomUUID();
    const whOrderId = randomUUID();
    const whFulfilId = randomUUID();
    const whPayRef = `PSTK_${whOrderId}_${suffix}`;

    runPsql(`
      INSERT INTO public.marketplace_sellers (id, profile_id, business_name, seller_type, verification_status)
      VALUES ('${whSellerId}', '${staff.id}', 'WH Agro ${suffix}', 'agro_dealer', 'verified');
      INSERT INTO public.marketplace_categories (id, slug, name)
      VALUES ('${whCatId}', 'wh-cat-${suffix}', 'WH Category ${suffix}');
      INSERT INTO public.marketplace_listings (
        id, seller_id, category_id, listing_type, title, unit, price_model,
        base_price_kobo, min_order_quantity, available_quantity, location, location_state, status
      ) VALUES (
        '${whListingId}', '${whSellerId}', '${whCatId}', 'input', 'Maize Seed ${suffix}', 'bag', 'fixed',
        50000, 1, 10, extensions.st_geogfromtext('SRID=4326;POINT(3.9470 7.3775)'), 'Oyo', 'active'
      );
      INSERT INTO public.marketplace_inventory_lots (listing_id, lot_number, physical_quantity, reserved_quantity, allocated_quantity)
      VALUES ('${whListingId}', 'LOT-WH-${suffix}', 10, 1, 0);
      INSERT INTO public.marketplace_orders (
        id, order_number, buyer_id, order_type, items_subtotal_kobo, delivery_fee_kobo,
        platform_fee_kobo, total_amount_kobo, status, payment_status, payment_mode, delivery_address
      ) VALUES (
        '${whOrderId}', 'ORD-WH-${suffix}', '${user.id}', 'retail', 50000, 0, 0, 50000, 'payment_pending', 'pending', 'escrow', '{"state":"Oyo"}'::jsonb
      );
      INSERT INTO public.marketplace_order_items (
        order_id, listing_id, seller_id, title, unit, quantity, unit_price_kobo, subtotal_kobo, commission_bps, commission_kobo, seller_earnings_kobo
      ) VALUES (
        '${whOrderId}', '${whListingId}', '${whSellerId}', 'Maize Seed', 'bag', 1, 50000, 50000, 500, 2500, 47500
      );
      INSERT INTO public.marketplace_fulfilments (id, order_id, seller_id, fulfilment_number, status, subtotal_kobo, delivery_fee_kobo, delivery_method)
      VALUES ('${whFulfilId}', '${whOrderId}', '${whSellerId}', 'FUL-WH-${suffix}', 'placed', 50000, 0, 'seller_delivery');
    `);

    const badAmtRes = await rpcCall(SERVICE_ROLE_KEY, 'process_payment_webhook', {
      p_reference: whPayRef,
      p_provider: 'paystack',
      p_amount_kobo: 1000,
      p_order_id: whOrderId,
      p_gateway_data: {},
    });
    assert.ok(!badAmtRes.ok, `Expected mismatched webhook amount to fail, got ${badAmtRes.status}`);

    const okWhRes = await rpcCall(SERVICE_ROLE_KEY, 'process_payment_webhook', {
      p_reference: whPayRef,
      p_provider: 'paystack',
      p_amount_kobo: 50000,
      p_order_id: whOrderId,
      p_gateway_data: { reference: whPayRef },
    });
    const okWhText = await okWhRes.text();
    assert.equal(okWhRes.status, 200, `Expected 200 from process_payment_webhook, got ${okWhText}`);
    const okWhJson = JSON.parse(okWhText);
    assert.equal(okWhJson.success, true);

    const dupWhRes = await rpcCall(SERVICE_ROLE_KEY, 'process_payment_webhook', {
      p_reference: whPayRef,
      p_provider: 'paystack',
      p_amount_kobo: 50000,
      p_order_id: whOrderId,
      p_gateway_data: { reference: whPayRef },
    });
    const dupWhText = await dupWhRes.text();
    assert.equal(dupWhRes.status, 200, `Expected 200 from duplicate process_payment_webhook, got ${dupWhText}`);
    const dupWhJson = JSON.parse(dupWhText);
    assert.equal(dupWhJson.already_processed, true);

    const ledgerCount = runPsql(`
      SELECT count(*) FROM public.marketplace_journal_entries
      WHERE reference_id = '${whOrderId}' AND reference_type = 'order_payment';
    `);
    assert.equal(ledgerCount, '1', `Expected exactly 1 order_payment ledger entry, got ${ledgerCount}`);
    console.log('   PASS: process_payment_webhook rejected unknown/mismatched, cleared valid, and handled duplicate idempotently.');

    console.log('6. Testing execute_account_deletion + Storage cleanup + Auth deletion against live local Supabase...');
    const delUser = await createAndSignInUser(`del-${suffix}@example.com`, 'Pass1234!');
    createdUsers.push(delUser.id);
    const delDocPath = `${delUser.id}/${randomUUID()}.pdf`;

    const uploadRes = await fetch(`${API_URL}/storage/v1/object/verification-documents/${delDocPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${delUser.token}`,
        apikey: ANON_KEY,
        'Content-Type': 'application/pdf',
      },
      body: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
    });
    assert.ok(uploadRes.ok, `Expected PDF upload to verification-documents to succeed, got ${uploadRes.status}`);

    const delOrderId = randomUUID();
    runPsql(`
      INSERT INTO public.verification_documents (profile_id, document_type, storage_path, mime_type, size_bytes)
      VALUES ('${delUser.id}', 'national_id', '${delDocPath}', 'application/pdf', 4);
      INSERT INTO public.marketplace_orders (
        id, order_number, buyer_id, order_type, items_subtotal_kobo, delivery_fee_kobo,
        platform_fee_kobo, total_amount_kobo, status, payment_status, payment_mode, delivery_address
      ) VALUES (
        '${delOrderId}', 'ORD-DEL-${suffix}', '${delUser.id}', 'retail', 10000, 0, 0, 10000,
        'completed', 'released', 'escrow', '{"line":"12 Farm Ave","state":"Oyo"}'::jsonb
      );
      INSERT INTO public.device_models (id, model_code, name, vendor, connectivity)
      VALUES ('${delModelId}', 'MOD-DEL-${suffix}', 'Test Valve Node', 'CultivaNode', 'lorawan');
      INSERT INTO public.devices (id, serial_number, model_id, assigned_owner_id)
      VALUES ('${delDeviceId}', 'SN-DEL-${suffix}', '${delModelId}', '${delUser.id}');
      INSERT INTO public.device_commands (
        id, device_id, command_type, parameters, status, failsafe_conditions,
        created_by, executed_at, audit_note
      ) VALUES (
        '${delCmdId}', '${delDeviceId}', 'valve_open', '{"duration_sec":30}'::jsonb,
        'acknowledged', '{"manual_override_required":true}'::jsonb,
        '${delUser.id}', '2026-11-18T10:00:00Z'::timestamptz, 'Manual irrigation test'
      );
    `);

    // Unauthorised authenticated user cannot call execute_account_deletion directly
    const unauthDel = await rpcCall(delUser.token, 'execute_account_deletion', {
      p_user_id: delUser.id,
      p_reason: 'Direct RPC test',
    });
    assert.equal(unauthDel.status, 403, `Expected 403 for authenticated calling execute_account_deletion, got ${unauthDel.status}`);

    // Service-role executes Phase 1 (DB anonymisation + durable Storage queue)
    const svcDelRes = await rpcCall(SERVICE_ROLE_KEY, 'execute_account_deletion', {
      p_user_id: delUser.id,
      p_reason: 'Live integration deletion',
    });
    const svcDelText = await svcDelRes.text();
    assert.equal(svcDelRes.status, 200, `Expected 200 from execute_account_deletion, got ${svcDelText}`);
    const svcDelJson = JSON.parse(svcDelText);
    assert.equal(svcDelJson.status, 'anonymized');
    assert.equal(svcDelJson.deletion_status, 'storage_pending');
    assert.equal(svcDelJson.pending_storage_count, 1);

    // Phase 2a: Claim Storage item, simulate a Storage failure, and verify data_request stays open
    const claim1Res = await rpcCall(SERVICE_ROLE_KEY, 'claim_account_deletion_storage_cleanup', { p_user_id: delUser.id });
    assert.equal(claim1Res.status, 200);
    const claimed1 = await claim1Res.json();
    assert.equal(claimed1.length, 1);
    assert.equal(claimed1[0].storage_path, delDocPath);

    const recFailRes = await rpcCall(SERVICE_ROLE_KEY, 'record_account_deletion_storage_result', {
      p_cleanup_id: claimed1[0].id,
      p_status: 'failed',
      p_error: 'Simulated Storage 503',
      p_lease_token: claimed1[0].lease_token,
    });
    assert.equal(recFailRes.status, 200);
    const reqStatusMid = runPsql(`SELECT status::text FROM public.data_requests WHERE profile_id = '${delUser.id}' AND kind = 'deletion';`);
    assert.equal(reqStatusMid, 'open', 'Expected data_request to stay open while Storage cleanup is failed');

    // Phase 2b: Simulate worker crash leaving 'processing' lease, verify active lease blocks concurrent claim, then expire & reclaim
    const claim2Res = await rpcCall(SERVICE_ROLE_KEY, 'claim_account_deletion_storage_cleanup', { p_user_id: delUser.id, p_lease_seconds: 300 });
    assert.equal(claim2Res.status, 200);
    const claimed2 = await claim2Res.json();
    assert.equal(claimed2.length, 1);
    assert.equal(claimed2[0].attempts, 2);
    assert.ok(claimed2[0].lease_token, 'Expected claim to return lease_token');

    const claimWhileActiveRes = await rpcCall(SERVICE_ROLE_KEY, 'claim_account_deletion_storage_cleanup', { p_user_id: delUser.id, p_lease_seconds: 300 });
    assert.equal(claimWhileActiveRes.status, 200);
    assert.deepEqual(await claimWhileActiveRes.json(), []);

    runPsql(`
      UPDATE public.account_deletion_storage_cleanup
         SET lease_expires_at = clock_timestamp() - interval '1 second'
       WHERE id = '${claimed2[0].id}';
    `);

    const claim3Res = await rpcCall(SERVICE_ROLE_KEY, 'claim_account_deletion_storage_cleanup', { p_user_id: delUser.id, p_lease_seconds: 300 });
    assert.equal(claim3Res.status, 200);
    const claimed3 = await claim3Res.json();
    assert.equal(claimed3.length, 1);
    assert.equal(claimed3[0].attempts, 3);
    assert.notEqual(claimed3[0].lease_token, claimed2[0].lease_token);

    const rmRes = await fetch(`${API_URL}/storage/v1/object/${claimed3[0].bucket_id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefixes: [claimed3[0].storage_path] }),
    });
    assert.ok(rmRes.ok, `Expected Storage cleanup to succeed, got ${rmRes.status}`);

    const recOkRes = await rpcCall(SERVICE_ROLE_KEY, 'record_account_deletion_storage_result', {
      p_cleanup_id: claimed3[0].id,
      p_status: 'completed',
      p_lease_token: claimed3[0].lease_token,
    });
    assert.equal(recOkRes.status, 200);

    // Stale Worker 2 attempting to record 'failed' with expired lease_token must be rejected
    const staleRecRes = await rpcCall(SERVICE_ROLE_KEY, 'record_account_deletion_storage_result', {
      p_cleanup_id: claimed2[0].id,
      p_status: 'failed',
      p_error: 'Stale worker failure',
      p_lease_token: claimed2[0].lease_token,
    });
    assert.equal(staleRecRes.status, 400, `Expected 400 for stale lease_token, got ${staleRecRes.status}`);

    // Verify Storage object is absent
    const fetchDeletedDoc = await fetch(`${API_URL}/storage/v1/object/authenticated/verification-documents/${delDocPath}`, {
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
    });
    assert.ok(!fetchDeletedDoc.ok, 'Expected deleted verification document to be absent from Storage');

    // Phase 3: Delete Auth user via GoTrue Admin API, verify post-Auth incomplete listing, then finalize
    const authDelRes = await fetch(`${API_URL}/auth/v1/admin/users/${delUser.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
    });
    assert.ok(authDelRes.ok, `Expected Auth deleteUser to succeed, got ${authDelRes.status}`);

    const incompleteRes = await rpcCall(SERVICE_ROLE_KEY, 'list_incomplete_account_deletions', { p_limit: 50 });
    assert.equal(incompleteRes.status, 200);
    const incompleteRows = await incompleteRes.json();
    assert.ok(
      incompleteRows.some((r) => r.profile_id === delUser.id && r.deletion_status === 'auth_pending'),
      'Expected post-Auth unfinalized user to appear in list_incomplete_account_deletions',
    );

    const authCheckAfterDel = await fetch(`${API_URL}/auth/v1/admin/users/${delUser.id}`, {
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
    });
    assert.equal(authCheckAfterDel.status, 404, 'Expected Auth user lookup to return 404 after Auth deletion');

    const finRes = await rpcCall(SERVICE_ROLE_KEY, 'finalize_account_deletion', {
      p_user_id: delUser.id,
      p_auth_deleted: true,
    });
    assert.equal(finRes.status, 200);
    const finalizeJson = await finRes.json();
    assert.equal(finalizeJson.deletion_status, 'completed');

    const incompleteAfterRes = await rpcCall(SERVICE_ROLE_KEY, 'list_incomplete_account_deletions', { p_limit: 50 });
    assert.equal(incompleteAfterRes.status, 200);
    const incompleteAfterRows = await incompleteAfterRes.json();
    assert.ok(
      !incompleteAfterRows.some((r) => r.profile_id === delUser.id),
      'Expected finalized user to be absent from list_incomplete_account_deletions',
    );

    const profileCheck = runPsql(`
      SELECT full_name || '|' || deletion_status || '|' || (deleted_at IS NOT NULL)::text
      FROM public.profiles WHERE id = '${delUser.id}';
    `);
    assert.equal(profileCheck, 'Deleted user|completed|true');

    const reqStatusFinal = runPsql(`SELECT status::text FROM public.data_requests WHERE profile_id = '${delUser.id}' AND kind = 'deletion';`);
    assert.equal(reqStatusFinal, 'completed');

    const orderRedacted = runPsql(`
      SELECT delivery_address->>'redacted' FROM public.marketplace_orders WHERE id = '${delOrderId}';
    `);
    assert.equal(orderRedacted, 'true');

    // Verify device_commands audit record survives Auth deletion with created_by = NULL and unchanged payload
    const cmdRow = runPsql(`
      SELECT (created_by IS NULL)::text
          || '|' || command_type
          || '|' || (parameters->>'duration_sec')
          || '|' || status
          || '|' || (failsafe_conditions->>'manual_override_required')
          || '|' || (executed_at IS NOT NULL)::text
          || '|' || coalesce(audit_note, '')
      FROM public.device_commands
      WHERE id = '${delCmdId}';
    `);
    assert.equal(cmdRow, 'true|valve_open|30|acknowledged|true|true|Manual irrigation test');

    // Verify repeated finalisation remains terminal and idempotent
    const repeatFinRes = await rpcCall(SERVICE_ROLE_KEY, 'finalize_account_deletion', {
      p_user_id: delUser.id,
      p_auth_deleted: false,
      p_auth_error: 'Late duplicate call',
    });
    assert.equal(repeatFinRes.status, 200);
    assert.equal((await repeatFinRes.json()).deletion_status, 'completed');
    const delAuditCount = runPsql(`
      SELECT count(*)::text FROM public.audit_log WHERE entity_id = '${delUser.id}' AND action = 'account_deleted';
    `);
    assert.equal(delAuditCount, '1');

    // Verify service_role-only restriction on device_commands remains enforced
    const anonCmdRes = await fetch(`${API_URL}/rest/v1/device_commands?id=eq.${delCmdId}`, {
      headers: { Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
    });
    assert.ok(anonCmdRes.status === 401 || anonCmdRes.status === 403, `Expected 401/403 for anon device_commands read, got ${anonCmdRes.status}`);

    console.log('   PASS: 3-phase execute_account_deletion recovered Storage failure, cleaned Storage, deleted Auth user, finalized, and preserved orders & device_commands.');
  } finally {
    runPsql(`
      DELETE FROM public.device_commands WHERE id = '${delCmdId}';
      DELETE FROM public.devices WHERE id = '${delDeviceId}';
      DELETE FROM public.device_models WHERE id = '${delModelId}';
      DELETE FROM public.marketplace_journal_entries WHERE reference_id = '${ledgerRef}';
      DELETE FROM public.support_tickets WHERE id = '${ticketId}';
    `);
    for (const uid of createdUsers) {
      await deleteUser(uid);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
