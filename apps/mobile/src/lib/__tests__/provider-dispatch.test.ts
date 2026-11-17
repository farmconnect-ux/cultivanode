import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  declineJob,
  hasProviderAccess,
  isValidJobId,
  loadMachineryFleet,
  loadProviderJobById,
  loadProviderJobs,
  submitWorkProofPhoto,
  validateDeclineReason,
} from '../provider-dispatch';
import { supabase } from '../supabase';

const mockOrder = vi.fn();
const mockEq = vi.fn(() => ({ order: mockOrder }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockUpload = vi.fn();

vi.mock('../supabase', () => ({
  sessionStorage: { getItem: vi.fn(), setItem: vi.fn() },
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({ select: mockSelect })),
    auth: { getUser: vi.fn() },
    storage: { from: vi.fn(() => ({ upload: mockUpload })) },
  },
}));

const VALID_JOB_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_JOB_ID = '22222222-2222-4222-8222-222222222222';
const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('provider dispatch (no demo fallbacks)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns only live provider-side jobs and never demo jobs', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [
        {
          id: VALID_JOB_ID,
          my_side: 'provider',
          status: 'accepted',
          title: 'Tractor Ploughing',
          kind: 'equipment',
          job_date: '2026-11-20',
          unit: 'hectare',
          quantity: 4,
          rate_kobo: 3000000,
          total_kobo: 12000000,
          distance_km: 5.2,
          farm_name: 'Kola Farm',
          other_name: 'Kola Ade',
          created_at: '2026-11-17T08:00:00Z',
          expires_at: '2026-11-18T08:00:00Z',
        },
        {
          id: OTHER_JOB_ID,
          my_side: 'farmer',
          status: 'requested',
          title: 'Farmer-side job',
          kind: 'equipment',
          job_date: '2026-11-21',
          unit: 'hectare',
          quantity: 2,
          rate_kobo: 1000000,
          total_kobo: 2000000,
          distance_km: 3,
          farm_name: 'Other',
          other_name: 'Someone',
          created_at: '2026-11-17T08:00:00Z',
          expires_at: '2026-11-18T08:00:00Z',
        },
      ],
      error: null,
    } as never);

    const res = await loadProviderJobs();
    expect(supabase.rpc).toHaveBeenCalledWith('my_bookings', { p_limit: 100 });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data).toHaveLength(1);
      expect(res.data[0].id).toBe(VALID_JOB_ID);
      expect(res.data[0].farmerName).toBe('Kola Ade');
    }
  });

  it('returns an empty list (never demo jobs) when live database has zero bookings', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [], error: null } as never);
    const res = await loadProviderJobs();
    expect(res).toEqual({ ok: true, data: [] });
  });

  it('classifies network, authentication, permission, and invalid responses distinctly', async () => {
    vi.mocked(supabase.rpc).mockRejectedValueOnce(new Error('Network request failed'));
    expect(await loadProviderJobs()).toMatchObject({ ok: false, kind: 'network' });

    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST301', message: 'JWT expired' },
    } as never);
    expect(await loadProviderJobs()).toMatchObject({ ok: false, kind: 'unauthenticated' });

    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { code: '42501', message: 'permission denied for function my_bookings' },
    } as never);
    expect(await loadProviderJobs()).toMatchObject({ ok: false, kind: 'forbidden' });

    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: 'bad-payload', error: null } as never);
    expect(await loadProviderJobs()).toMatchObject({ ok: false, kind: 'invalid' });
  });

  it('loads single job by UUID and rejects invalid or missing job IDs', async () => {
    expect(await loadProviderJobById('not-a-uuid')).toMatchObject({ ok: false, kind: 'invalid' });

    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [], error: null } as never);
    expect(await loadProviderJobById(VALID_JOB_ID)).toMatchObject({ ok: false, kind: 'not_found' });
  });

  it('loads real machinery listings scoped by owner_id and never returns demo tractors', async () => {
    expect(await loadMachineryFleet(undefined)).toMatchObject({ ok: false, kind: 'unauthenticated' });

    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    expect(await loadMachineryFleet(USER_ID)).toEqual({ ok: true, data: [] });
    expect(supabase.from).toHaveBeenCalledWith('listings');
    expect(mockEq).toHaveBeenCalledWith('owner_id', USER_ID);

    mockOrder.mockResolvedValueOnce({
      data: [
        {
          id: '33333333-3333-4333-8333-333333333333',
          title: 'Massey Ferguson 375',
          category: 'tractor',
          pricing_unit: 'hectare',
          rate_kobo: 4000000,
          service_radius_km: 25,
          status: 'active',
          operator_included: true,
        },
      ],
      error: null,
    });
    const res = await loadMachineryFleet(USER_ID);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data).toHaveLength(1);
      expect(res.data[0].title).toBe('Massey Ferguson 375');
      expect(res.data[0].totalBookingsCompleted).toBe(0);
    }

    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'Network error' } });
    expect(await loadMachineryFleet(USER_ID)).toMatchObject({ ok: false, kind: 'network' });
  });

  it('requires authentication and successful storage upload before calling submit_proof', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({ data: { user: null }, error: null } as never);
    const noAuth = await submitWorkProofPhoto(VALID_JOB_ID, 'file://photo.jpg', 'before', {
      latitude: 7.37,
      longitude: 3.94,
      accuracy: 5,
      timestamp: Date.now(),
    });
    expect(noAuth.success).toBe(false);
    expect(mockUpload).not.toHaveBeenCalled();

    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({ data: { user: { id: USER_ID } }, error: null } as never);
    mockUpload.mockResolvedValueOnce({ error: { message: 'Storage upload failed' } });
    const uploadFail = await submitWorkProofPhoto(VALID_JOB_ID, 'file://photo.jpg', 'before', {
      latitude: 7.37,
      longitude: 3.94,
      accuracy: 5,
      timestamp: Date.now(),
    });
    expect(uploadFail).toEqual({ success: false, error: 'Storage upload failed' });
    expect(supabase.rpc).not.toHaveBeenCalled();

    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({ data: { user: { id: USER_ID } }, error: null } as never);
    mockUpload.mockResolvedValueOnce({ error: null });
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ error: null } as never);
    const okProof = await submitWorkProofPhoto(
      VALID_JOB_ID,
      'file://photo.jpg',
      'before',
      { latitude: 7.37, longitude: 3.94, accuracy: 5, timestamp: 1700000000000 },
      2.5
    );
    expect(okProof.success).toBe(true);
    expect(okProof.path).toContain(`${VALID_JOB_ID}/${USER_ID}/`);
    expect(supabase.storage.from).toHaveBeenCalledWith('booking-proofs');
    expect(supabase.rpc).toHaveBeenCalledWith('submit_proof', expect.objectContaining({
      p_booking: VALID_JOB_ID,
      p_kind: 'before',
      p_lat: 7.37,
      p_lng: 3.94,
      p_hectares: 2.5,
    }));
  });

  it('validates decline reasons cross-platform and blocks invalid submissions', async () => {
    expect(validateDeclineReason('   ').valid).toBe(false);
    expect(validateDeclineReason('no').valid).toBe(false);
    expect(validateDeclineReason('a'.repeat(301)).valid).toBe(false);
    expect(validateDeclineReason('  Tractor under repair  ')).toEqual({
      valid: true,
      trimmed: 'Tractor under repair',
    });

    const badDecline = await declineJob(VALID_JOB_ID, '  ');
    expect(badDecline.success).toBe(false);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('checks provider role permissions and job UUID format', () => {
    expect(hasProviderAccess(null)).toBe(false);
    expect(hasProviderAccess([{ role: 'crop_farmer' }])).toBe(false);
    expect(hasProviderAccess([{ role: 'equipment_provider' }])).toBe(true);
    expect(hasProviderAccess([{ role: 'service_provider' }])).toBe(true);
    expect(isValidJobId(VALID_JOB_ID)).toBe(true);
    expect(isValidJobId('job-req-001')).toBe(false);
  });
});
