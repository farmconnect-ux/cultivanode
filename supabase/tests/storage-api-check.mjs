import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const API_URL = process.env.API_URL ?? process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON_KEY = process.env.ANON_KEY ?? '';
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY ?? '';
const DB_URL = process.env.DB_URL ?? process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

assert.ok(ANON_KEY, 'ANON_KEY must be set from supabase status -o env');
assert.ok(SERVICE_ROLE_KEY, 'SERVICE_ROLE_KEY must be set from supabase status -o env');

const BUCKET = 'verification-documents';
const PDF_BYTES = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n', 'utf8');

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
    headers: {
      apikey: ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const login = await loginRes.json();
  assert.ok(loginRes.ok && login.access_token, `Failed signing in ${email}: ${JSON.stringify(login)}`);

  return { id: created.id, email, token: login.access_token };
}

async function deleteUser(userId) {
  await fetch(`${API_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
  }).catch(() => undefined);
}

async function storageUpload(token, path, body, contentType, upsert = false) {
  return fetch(`${API_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: ANON_KEY,
      'Content-Type': contentType,
      'x-upsert': String(upsert),
    },
    body,
  });
}

async function storageDownload(token, path) {
  return fetch(`${API_URL}/storage/v1/object/authenticated/${BUCKET}/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: ANON_KEY,
    },
  });
}

async function storageSign(token, path, expiresIn = 600) {
  return fetch(`${API_URL}/storage/v1/object/sign/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expiresIn }),
  });
}

async function storageRemove(token, paths) {
  return fetch(`${API_URL}/storage/v1/object/${BUCKET}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefixes: paths }),
  });
}

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const createdUsers = [];
  const uploadedPaths = [];

  try {
    const owner = await createAndSignInUser(`owner-${suffix}@example.com`, 'TestPass!123');
    createdUsers.push(owner.id);
    const outsider = await createAndSignInUser(`outsider-${suffix}@example.com`, 'TestPass!123');
    createdUsers.push(outsider.id);
    const reviewer = await createAndSignInUser(`reviewer-${suffix}@example.com`, 'TestPass!123');
    createdUsers.push(reviewer.id);
    const supportStaff = await createAndSignInUser(`support-${suffix}@example.com`, 'TestPass!123');
    createdUsers.push(supportStaff.id);

    // Assign narrowly permissioned verification_officer role to reviewer, and support_disputes (no verification.review) to supportStaff
    runPsql(`
      INSERT INTO public.admin_roles (profile_id, admin_role) VALUES
        ('${reviewer.id}', 'verification_officer'),
        ('${supportStaff.id}', 'support_disputes')
      ON CONFLICT DO NOTHING;
    `);

    const ownerPath = `${owner.id}/${randomUUID()}.pdf`;
    uploadedPaths.push(ownerPath);

    // 1. Bucket restrictions: reject disallowed MIME type and >5 MB file
    console.log('1. Testing bucket MIME type and 5 MB limit via Storage API...');
    const badMimeRes = await storageUpload(owner.token, `${owner.id}/bad.txt`, Buffer.from('hello'), 'text/plain');
    assert.ok(!badMimeRes.ok, `Expected text/plain upload to fail, got ${badMimeRes.status}`);

    const oversizedBuf = Buffer.alloc(5 * 1024 * 1024 + 1024, 0x25);
    const bigRes = await storageUpload(owner.token, `${owner.id}/huge.pdf`, oversizedBuf, 'application/pdf');
    assert.ok(!bigRes.ok, `Expected >5MB upload to fail, got ${bigRes.status}`);
    console.log(`   PASS: Storage API rejected disallowed MIME (${badMimeRes.status}) and >5MB (${bigRes.status}).`);

    // 2. Owner upload, download, signed URL creation & signed fetch
    console.log('2. Testing owner upload, download, and signed URL retrieval...');
    const upRes = await storageUpload(owner.token, ownerPath, PDF_BYTES, 'application/pdf');
    assert.equal(upRes.status, 200, `Owner upload failed: ${await upRes.text()}`);

    const dlRes = await storageDownload(owner.token, ownerPath);
    assert.equal(dlRes.status, 200, `Owner download failed: ${dlRes.status}`);
    const dlBuf = Buffer.from(await dlRes.arrayBuffer());
    assert.deepEqual(dlBuf, PDF_BYTES, 'Downloaded bytes did not match uploaded PDF');

    const signRes = await storageSign(owner.token, ownerPath, 600);
    assert.equal(signRes.status, 200, `Owner createSignedUrl failed: ${signRes.status}`);
    const signJson = await signRes.json();
    assert.ok(signJson.signedURL, `Expected signedURL in response: ${JSON.stringify(signJson)}`);

    const fetchedSigned = await fetch(`${API_URL}/storage/v1${signJson.signedURL}`);
    assert.equal(fetchedSigned.status, 200, `Signed URL fetch failed: ${fetchedSigned.status}`);
    const signedBuf = Buffer.from(await fetchedSigned.arrayBuffer());
    assert.deepEqual(signedBuf, PDF_BYTES, 'Signed URL bytes did not match uploaded PDF');
    console.log('   PASS: Owner upload, authenticated download, 600s signed URL creation, and HTTP signed fetch succeeded.');

    // 3. Cross-user isolation
    console.log('3. Testing cross-user upload, download, sign, overwrite, and delete denials...');
    const crossUp = await storageUpload(outsider.token, `${owner.id}/${randomUUID()}.pdf`, PDF_BYTES, 'application/pdf');
    assert.ok(!crossUp.ok, `Cross-user upload should fail, got ${crossUp.status}`);

    const crossDl = await storageDownload(outsider.token, ownerPath);
    assert.ok(!crossDl.ok, `Cross-user download should fail, got ${crossDl.status}`);

    const crossSign = await storageSign(outsider.token, ownerPath, 600);
    assert.ok(!crossSign.ok, `Cross-user createSignedUrl should fail, got ${crossSign.status}`);

    const crossOverwrite = await storageUpload(outsider.token, ownerPath, Buffer.from('pwned'), 'application/pdf', true);
    assert.ok(!crossOverwrite.ok, `Cross-user overwrite should fail, got ${crossOverwrite.status}`);

    const crossDel = await storageRemove(outsider.token, [ownerPath]);
    // Storage API returns 200 with empty array or error when RLS prevents deletion; verify object still exists!
    const stillThere = await storageDownload(owner.token, ownerPath);
    assert.equal(stillThere.status, 200, `Owner object must still exist after cross-user delete attempt (crossDel=${crossDel.status})`);
    console.log('   PASS: Cross-user upload, download, sign, overwrite, and delete all denied; object intact.');

    // 4. Narrowly permissioned reviewer vs support staff without verification.review
    console.log('4. Testing narrowly permissioned verification_officer vs support_disputes staff...');
    const supportDl = await storageDownload(supportStaff.token, ownerPath);
    assert.ok(!supportDl.ok, `Support staff without verification.review should not download, got ${supportDl.status}`);
    const supportSign = await storageSign(supportStaff.token, ownerPath, 600);
    assert.ok(!supportSign.ok, `Support staff without verification.review should not sign, got ${supportSign.status}`);

    const revSign = await storageSign(reviewer.token, ownerPath, 600);
    assert.equal(revSign.status, 200, `verification_officer createSignedUrl failed: ${revSign.status}`);
    const revJson = await revSign.json();
    const revFetch = await fetch(`${API_URL}/storage/v1${revJson.signedURL}`);
    assert.equal(revFetch.status, 200, `verification_officer signed URL fetch failed: ${revFetch.status}`);
    const revBuf = Buffer.from(await revFetch.arrayBuffer());
    assert.deepEqual(revBuf, PDF_BYTES, 'Reviewer signed URL bytes did not match uploaded PDF');
    console.log('   PASS: verification_officer accessed document via signed URL; support_disputes denied.');

    // 5. Owner deletion via Storage API & absence check
    console.log('5. Testing owner deletion via Storage API and verifying absence...');
    const ownerDel = await storageRemove(owner.token, [ownerPath]);
    assert.equal(ownerDel.status, 200, `Owner delete failed: ${ownerDel.status}`);
    const deletedJson = await ownerDel.json();
    assert.ok(Array.isArray(deletedJson) && deletedJson.length === 1, `Expected 1 deleted object, got ${JSON.stringify(deletedJson)}`);

    const afterDelDl = await storageDownload(owner.token, ownerPath);
    assert.ok(!afterDelDl.ok, `Expected deleted object download to fail, got ${afterDelDl.status}`);
    const afterDelSign = await storageSign(owner.token, ownerPath, 600);
    assert.ok(!afterDelSign.ok, `Expected deleted object sign to fail, got ${afterDelSign.status}`);
    console.log('   PASS: Owner deleted object via Storage API; subsequent download and sign failed (object absent).');
  } finally {
    await storageRemove(SERVICE_ROLE_KEY, uploadedPaths).catch(() => undefined);
    for (const uid of createdUsers) {
      await deleteUser(uid);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
