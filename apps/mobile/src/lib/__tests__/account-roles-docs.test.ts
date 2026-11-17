import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelRoleRequest,
  getVerificationDocumentSignedUrl,
  requestRole,
  uploadVerificationDocument,
  validateVerificationFile,
} from '../account';
import { supabase } from '../supabase';

const mockRoleInsert = vi.fn();
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
    rpc: vi.fn(),
    from: vi.fn((table: string) => {
      if (table === 'role_requests') return { insert: mockRoleInsert };
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
const REQ_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('mobile role requests and verification document uploads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('calls cancel_role_request RPC', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ error: null } as never);
    expect(await cancelRoleRequest(REQ_ID)).toEqual({ ok: true });
    expect(supabase.rpc).toHaveBeenCalledWith('cancel_role_request', { p_request_id: REQ_ID });
  });

  it('validates allowed MIME types and 5 MB size limit', () => {
    expect(validateVerificationFile({ mimeType: 'image/jpeg', sizeBytes: 1024 })).toEqual({ valid: true, ext: 'jpg' });
    expect(validateVerificationFile({ mimeType: 'application/pdf', sizeBytes: 5_242_880 })).toEqual({ valid: true, ext: 'pdf' });
    expect(validateVerificationFile({ mimeType: 'text/plain', sizeBytes: 100 }).valid).toBe(false);
    expect(validateVerificationFile({ mimeType: 'image/png', sizeBytes: 0 }).valid).toBe(false);
    expect(validateVerificationFile({ mimeType: 'image/png', sizeBytes: 5_242_881 }).valid).toBe(false);
  });

  it('uploads valid document to private bucket and cleans up storage if DB insert fails', async () => {
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
        id: 'doc-1',
        role_request_id: REQ_ID,
        document_type: 'national_id',
        storage_path: `${USER_ID}/00000000-0000-4000-8000-000000000099.jpg`,
        mime_type: 'image/jpeg',
        size_bytes: 4,
        status: 'pending',
        review_note: null,
        created_at: '2026-11-18T00:00:00Z',
      },
      error: null,
    });

    const okRes = await uploadVerificationDocument({
      userId: USER_ID,
      roleRequestId: REQ_ID,
      documentType: 'national_id',
      uri: 'file://id.jpg',
      mimeType: 'image/jpeg',
    });
    expect(okRes.ok).toBe(true);
    vi.unstubAllGlobals();
  });

  it('generates short-lived signed URLs for private documents', async () => {
    mockCreateSignedUrl.mockResolvedValueOnce({ data: { signedUrl: 'https://signed.example/doc' }, error: null });
    const res = await getVerificationDocumentSignedUrl(`${USER_ID}/doc.jpg`);
    expect(res).toEqual({ ok: true, url: 'https://signed.example/doc' });
    expect(mockCreateSignedUrl).toHaveBeenCalledWith(`${USER_ID}/doc.jpg`, 600);
  });
});
