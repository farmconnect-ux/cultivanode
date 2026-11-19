import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelRoleRequest,
  getVerificationDocumentSignedUrl,
  loadRoleRequests,
  requestRole,
  uploadVerificationDocument,
  validateVerificationFile,
} from '../account';
import { supabase } from '../supabase';

const mockGetUser = vi.fn();
const mockRoleInsert = vi.fn();
const mockRoleOrder = vi.fn();
const mockRoleEq = vi.fn(() => ({ order: mockRoleOrder }));
const mockRoleSelect = vi.fn(() => ({ eq: mockRoleEq }));
const mockDocSingle = vi.fn();
const mockDocSelect = vi.fn(() => ({ single: mockDocSingle }));
const mockDocInsert = vi.fn(() => ({ select: mockDocSelect }));
const mockUpload = vi.fn();
const mockRemove = vi.fn(async () => ({ error: null }));
const mockCreateSignedUrl = vi.fn();

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() },
}));

vi.mock('expo-crypto', () => ({
  randomUUID: () => '00000000-0000-4000-8000-000000000099',
}));

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    rpc: vi.fn(),
    from: vi.fn((table: string) => {
      if (table === 'role_requests') return { insert: mockRoleInsert, select: mockRoleSelect };
      if (table === 'verification_documents') return { insert: mockDocInsert };
      return {};
    }),
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        remove: mockRemove,
        createSignedUrl: mockCreateSignedUrl,
      })),
    },
  },
}));

const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_USER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const REQ_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('mobile role requests and verification document uploads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
  });

  it('requires providerType for service_provider and maps duplicate/held errors', async () => {
    const missingProvider = await requestRole({ role: 'service_provider' });
    expect(missingProvider).toEqual({ ok: false, error: 'Please select a service provider type.' });
    expect(mockRoleInsert).not.toHaveBeenCalled();

    mockRoleInsert.mockResolvedValueOnce({ error: { code: '23505', message: 'dup' } });
    expect(await requestRole({ role: 'machinery_owner' })).toEqual({
      ok: false,
      error: 'You already have a pending request for this role.',
    });

    mockRoleInsert.mockResolvedValueOnce({ error: { code: 'P0001', message: 'held' } });
    expect(await requestRole({ role: 'crop_farmer' })).toEqual({
      ok: false,
      error: 'You already hold this role.',
    });

    mockRoleInsert.mockResolvedValueOnce({ error: null });
    expect(await requestRole({ role: 'machinery_owner', note: '2 tractors' })).toEqual({ ok: true });
    expect(mockRoleInsert).toHaveBeenLastCalledWith({
      role: 'machinery_owner',
      provider_type: null,
      details: { note: '2 tractors' },
    });
  });

  it('loads role requests with pending/approved/rejected statuses and calls cancel_role_request RPC', async () => {
    mockRoleOrder.mockResolvedValueOnce({
      data: [
        { id: REQ_ID, role: 'machinery_owner', provider_type: null, status: 'approved', review_note: 'Verified', created_at: '2026-11-18T00:00:00Z', reviewed_at: '2026-11-18T01:00:00Z' },
        { id: 'req-2', role: 'logistics_provider', provider_type: null, status: 'rejected', review_note: 'Blurry ID', created_at: '2026-11-18T00:00:00Z', reviewed_at: '2026-11-18T01:00:00Z' },
      ],
      error: null,
    });
    const requests = await loadRoleRequests(USER_ID);
    expect(requests.map((r) => r.status)).toEqual(['approved', 'rejected']);

    vi.mocked(supabase.rpc).mockResolvedValueOnce({ error: null } as never);
    expect(await cancelRoleRequest(REQ_ID)).toEqual({ ok: true });
    expect(supabase.rpc).toHaveBeenCalledWith('cancel_role_request', { p_request_id: REQ_ID });
  });

  it('validates allowed MIME types and 5 MB size limit', () => {
    expect(validateVerificationFile({ mimeType: 'image/jpeg', sizeBytes: 1024 })).toEqual({ valid: true, ext: 'jpg' });
    expect(validateVerificationFile({ mimeType: 'image/webp', sizeBytes: 1024 })).toEqual({ valid: true, ext: 'webp' });
    expect(validateVerificationFile({ mimeType: 'application/pdf', sizeBytes: 5_242_880 })).toEqual({ valid: true, ext: 'pdf' });
    expect(validateVerificationFile({ mimeType: 'text/plain', sizeBytes: 100 }).valid).toBe(false);
    expect(validateVerificationFile({ mimeType: 'image/png', sizeBytes: 0 }).valid).toBe(false);
    expect(validateVerificationFile({ mimeType: 'image/png', sizeBytes: 5_242_881 }).valid).toBe(false);
  });

  it('rejects unauthenticated, mismatched-owner, and empty-byte uploads before touching storage', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const unauth = await uploadVerificationDocument({
      userId: USER_ID,
      roleRequestId: REQ_ID,
      documentType: 'national_id',
      uri: 'file://id.pdf',
      mimeType: 'application/pdf',
    });
    expect(unauth).toEqual({ ok: false, error: 'Authenticated session does not match document owner.' });
    expect(mockUpload).not.toHaveBeenCalled();

    const wrongOwner = await uploadVerificationDocument({
      userId: OTHER_USER_ID,
      roleRequestId: REQ_ID,
      documentType: 'national_id',
      uri: 'file://id.pdf',
      mimeType: 'application/pdf',
    });
    expect(wrongOwner).toEqual({ ok: false, error: 'Authenticated session does not match document owner.' });
    expect(mockUpload).not.toHaveBeenCalled();

    // Even if client-supplied sizeBytes is spoofed as 1024, actual 0-byte payload must be rejected
    vi.stubGlobal('fetch', vi.fn(async () => ({ arrayBuffer: async () => new Uint8Array(0).buffer })));
    const emptyRes = await uploadVerificationDocument({
      userId: USER_ID,
      roleRequestId: REQ_ID,
      documentType: 'national_id',
      uri: 'file://empty.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    });
    expect(emptyRes).toEqual({ ok: false, error: 'Selected file is empty.' });
    expect(mockUpload).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('uploads PDF and image documents to private bucket and cleans up storage if DB insert fails', async () => {
    const fakeBytes = new Uint8Array([1, 2, 3, 4]).buffer;
    vi.stubGlobal('fetch', vi.fn(async () => ({ arrayBuffer: async () => fakeBytes })));

    mockUpload.mockResolvedValueOnce({ error: null });
    mockDocSingle.mockResolvedValueOnce({ data: null, error: { message: 'RLS denied' } });

    const failedDb = await uploadVerificationDocument({
      userId: USER_ID,
      roleRequestId: REQ_ID,
      documentType: 'national_id',
      uri: 'file://id.jpg',
      mimeType: 'image/jpeg',
    });
    expect(failedDb).toEqual({ ok: false, error: 'RLS denied' });
    expect(mockRemove).toHaveBeenCalledWith([`${USER_ID}/00000000-0000-4000-8000-000000000099.jpg`]);

    mockUpload.mockResolvedValueOnce({ error: null });
    mockDocSingle.mockResolvedValueOnce({
      data: {
        id: 'doc-pdf-1',
        role_request_id: REQ_ID,
        document_type: 'cac_certificate',
        storage_path: `${USER_ID}/00000000-0000-4000-8000-000000000099.pdf`,
        mime_type: 'application/pdf',
        size_bytes: 4,
        status: 'pending',
        review_note: null,
        created_at: '2026-11-18T00:00:00Z',
      },
      error: null,
    });

    const pdfOk = await uploadVerificationDocument({
      userId: USER_ID,
      roleRequestId: REQ_ID,
      documentType: 'cac_certificate',
      uri: 'file://cac.pdf',
      mimeType: 'application/pdf',
    });
    expect(pdfOk.ok).toBe(true);
    expect(mockUpload).toHaveBeenLastCalledWith(
      `${USER_ID}/00000000-0000-4000-8000-000000000099.pdf`,
      fakeBytes,
      { contentType: 'application/pdf', upsert: false },
    );
    vi.unstubAllGlobals();
  });

  it('generates short-lived signed URLs for private documents and handles unauthorized failure', async () => {
    mockCreateSignedUrl.mockResolvedValueOnce({ data: { signedUrl: 'https://signed.example/doc' }, error: null });
    const res = await getVerificationDocumentSignedUrl(`${USER_ID}/doc.pdf`);
    expect(res).toEqual({ ok: true, url: 'https://signed.example/doc' });
    expect(mockCreateSignedUrl).toHaveBeenCalledWith(`${USER_ID}/doc.pdf`, 600);

    mockCreateSignedUrl.mockResolvedValueOnce({ data: null, error: { message: 'Object not found or unauthorized' } });
    const denied = await getVerificationDocumentSignedUrl(`${OTHER_USER_ID}/secret.pdf`);
    expect(denied).toEqual({ ok: false, error: 'Object not found or unauthorized' });
  });

  it('handles multi-role labels, provider permissions, specialty filtering, and tier gates', async () => {
    const {
      availableProviderTypesForRequest,
      canRequestRoleWithTier,
      formatRoleLabel,
      getRequestableRoles,
      isProviderRole,
    } = await import('../account');

    expect(
      isProviderRole({
        profile: {
          id: USER_ID,
          full_name: 'Amina',
          phone: '2348011111111',
          preferred_language: 'en',
          verification_tier: 1,
          account_type: 'individual',
          onboarded_at: '2026-11-18T00:00:00Z',
          state: 'Oyo',
          lga: 'Ibadan',
        },
        roles: [
          { role: 'crop_farmer', provider_type: null },
          { role: 'service_provider', provider_type: 'agronomist' },
        ],
        pending: [],
      }),
    ).toBe(true);

    expect(
      isProviderRole({
        profile: {
          id: USER_ID,
          full_name: 'Bola',
          phone: '2348011111112',
          preferred_language: 'en',
          verification_tier: 0,
          account_type: 'individual',
          onboarded_at: '2026-11-18T00:00:00Z',
          state: 'Oyo',
          lga: 'Ibadan',
        },
        roles: [{ role: 'crop_farmer', provider_type: null }],
        pending: [],
      }),
    ).toBe(false);

    expect(
      formatRoleLabel(
        'service_provider',
        'agronomist',
        { service_provider: 'Service provider' },
        { agronomist: 'Agronomist' },
      ),
    ).toBe('Service provider · Agronomist');

    const availableTypes = availableProviderTypesForRequest(
      [{ role: 'service_provider', provider_type: 'agronomist' }],
      [{ role: 'service_provider', provider_type: 'mechanic', status: 'pending' }],
      ['agronomist', 'mechanic', 'vet'],
    );
    expect(availableTypes).toEqual(['vet']);

    const requestable = getRequestableRoles(
      [
        { role: 'crop_farmer', auto_approve: true, requires_documents: false, min_verification_tier: 0 },
        { role: 'machinery_owner', auto_approve: false, requires_documents: true, min_verification_tier: 0 },
        { role: 'service_provider', auto_approve: false, requires_documents: true, min_verification_tier: 0 },
        { role: 'field_agent', auto_approve: false, requires_documents: true, min_verification_tier: 1 },
      ],
      [
        { role: 'crop_farmer', provider_type: null },
        { role: 'service_provider', provider_type: 'agronomist' },
      ],
      [{ role: 'machinery_owner', provider_type: null, status: 'pending' }],
      ['agronomist', 'vet'],
    );
    expect(requestable.map((r) => r.role)).toEqual(['service_provider', 'field_agent']);

    expect(canRequestRoleWithTier(requestable[1], 0)).toBe(false);
    expect(canRequestRoleWithTier(requestable[1], 1)).toBe(true);
  });
});
