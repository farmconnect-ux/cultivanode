import { VERIFICATION_UPLOAD_LIMITS, type AppRole, type ProviderType } from '@cultivanode/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  preferred_language: 'en' | 'yo' | 'pcm';
  verification_tier: number;
  account_type: 'individual' | 'business';
  onboarded_at: string | null;
  state: string | null;
  lga: string | null;
};

export type Account = {
  profile: Profile;
  roles: { role: AppRole; provider_type: ProviderType | null }[];
  pending: { role: AppRole; provider_type: ProviderType | null }[];
};

export type RoleOption = {
  role: AppRole;
  auto_approve: boolean;
  requires_documents: boolean;
  min_verification_tier: number;
};

export type RoleRequestRecord = {
  id: string;
  role: AppRole;
  provider_type: ProviderType | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  details: Record<string, unknown> | null;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type VerificationDocumentType =
  | 'national_id'
  | 'cac_certificate'
  | 'proof_of_address'
  | 'equipment_ownership'
  | 'professional_licence'
  | 'photo'
  | 'other';

export type VerificationDocumentRecord = {
  id: string;
  role_request_id: string | null;
  document_type: VerificationDocumentType;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  status: 'pending' | 'accepted' | 'rejected';
  review_note: string | null;
  created_at: string;
};

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

/** The signed-in person's profile, roles and pending role requests. Row-level security limits it to them. */
export async function loadAccount(userId: string): Promise<Account | null> {
  try {
    const [profile, roles, requests] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, phone, preferred_language, verification_tier, account_type, onboarded_at, state, lga')
        .eq('id', userId)
        .maybeSingle(),
      supabase.from('user_roles').select('role, provider_type').eq('profile_id', userId),
      supabase.from('role_requests').select('role, provider_type').eq('profile_id', userId).eq('status', 'pending'),
    ]);
    if (profile.error || roles.error || requests.error) throw new Error('account_load_failed');
    if (!profile.data) return null;

    const account: Account = { profile: profile.data as Profile, roles: roles.data ?? [], pending: requests.data ?? [] };
    await AsyncStorage.setItem(`cache_account_${userId}`, JSON.stringify(account));
    return account;
  } catch (err) {
    const cached = await AsyncStorage.getItem(`cache_account_${userId}`);
    if (cached) return JSON.parse(cached);
    throw err;
  }
}

/** Roles open for sign-up, auto-approved ones first (same list the website shows). */
export async function loadRoleOptions(): Promise<RoleOption[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('role, auto_approve, requires_documents, min_verification_tier')
    .eq('available', true)
    .order('auto_approve', { ascending: false });
  if (error) throw new Error('roles_load_failed');
  return (data ?? []) as RoleOption[];
}

export async function loadRoleRequests(userId: string): Promise<RoleRequestRecord[]> {
  const { data, error } = await supabase
    .from('role_requests')
    .select('id, role, provider_type, status, details, review_note, reviewed_at, created_at')
    .eq('profile_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message || 'role_requests_load_failed');
  return (data ?? []) as RoleRequestRecord[];
}

export async function loadVerificationDocuments(userId: string): Promise<VerificationDocumentRecord[]> {
  const { data, error } = await supabase
    .from('verification_documents')
    .select('id, role_request_id, document_type, storage_path, mime_type, size_bytes, status, review_note, created_at')
    .eq('profile_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message || 'verification_documents_load_failed');
  return (data ?? []) as VerificationDocumentRecord[];
}

export async function requestRole(input: {
  role: AppRole;
  providerType?: ProviderType | null;
  note?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.role === 'service_provider' && !input.providerType) {
    return { ok: false, error: 'Please select a service provider type.' };
  }
  const trimmedNote = input.note?.trim().slice(0, 500) || '';
  const { error } = await supabase.from('role_requests').insert({
    role: input.role,
    provider_type: input.role === 'service_provider' ? (input.providerType ?? null) : null,
    details: trimmedNote ? { note: trimmedNote } : {},
  });

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'You already have a pending request for this role.' };
    }
    if (error.code === 'P0001') {
      return { ok: false, error: 'You already hold this role.' };
    }
    return { ok: false, error: error.message || 'Could not submit role request.' };
  }
  return { ok: true };
}

export async function cancelRoleRequest(
  requestId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.rpc('cancel_role_request', { p_request_id: requestId });
  if (error) {
    return { ok: false, error: error.message || 'Could not cancel role request.' };
  }
  return { ok: true };
}

export function validateVerificationFile(input: {
  mimeType: string;
  sizeBytes: number;
}): { valid: true; ext: string } | { valid: false; error: string } {
  const mime = input.mimeType.toLowerCase().trim();
  const ext = EXTENSIONS[mime];
  if (!ext || !(VERIFICATION_UPLOAD_LIMITS.mimeTypes as readonly string[]).includes(mime)) {
    return { valid: false, error: 'Only JPEG, PNG, WebP, or PDF files are accepted.' };
  }
  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
    return { valid: false, error: 'Selected file is empty.' };
  }
  if (input.sizeBytes > VERIFICATION_UPLOAD_LIMITS.maxBytes) {
    return { valid: false, error: 'File must be 5 MB or smaller.' };
  }
  return { valid: true, ext };
}

export async function uploadVerificationDocument(input: {
  userId: string;
  roleRequestId: string | null;
  documentType: VerificationDocumentType;
  uri: string;
  mimeType: string;
  sizeBytes?: number;
}): Promise<{ ok: true; document: VerificationDocumentRecord } | { ok: false; error: string }> {
  if (!input.userId) {
    return { ok: false, error: 'Please sign in before uploading a document.' };
  }

  const { data: authData } = await supabase.auth.getUser();
  const verifiedUserId = authData?.user?.id;
  if (!verifiedUserId || verifiedUserId !== input.userId) {
    return { ok: false, error: 'Authenticated session does not match document owner.' };
  }

  let bytes: ArrayBuffer;
  try {
    const res = await fetch(input.uri);
    bytes = await res.arrayBuffer();
  } catch {
    return { ok: false, error: 'Could not read the selected file from this device.' };
  }

  const actualSize = bytes.byteLength;
  const check = validateVerificationFile({ mimeType: input.mimeType, sizeBytes: actualSize });
  if (!check.valid) {
    return { ok: false, error: check.error };
  }

  const storagePath = `${verifiedUserId}/${Crypto.randomUUID()}.${check.ext}`;
  const bucket = supabase.storage.from('verification-documents');

  const { error: uploadErr } = await bucket.upload(storagePath, bytes, {
    contentType: input.mimeType,
    upsert: false,
  });
  if (uploadErr) {
    return { ok: false, error: uploadErr.message || 'Could not upload document to storage.' };
  }

  const { data: inserted, error: dbErr } = await supabase
    .from('verification_documents')
    .insert({
      role_request_id: input.roleRequestId,
      document_type: input.documentType,
      storage_path: storagePath,
      mime_type: input.mimeType,
      size_bytes: actualSize,
    })
    .select('id, role_request_id, document_type, storage_path, mime_type, size_bytes, status, review_note, created_at')
    .single();

  if (dbErr || !inserted) {
    await bucket.remove([storagePath]).catch(() => undefined);
    return { ok: false, error: dbErr?.message || 'Could not save document metadata.' };
  }

  return { ok: true, document: inserted as VerificationDocumentRecord };
}

export async function getVerificationDocumentSignedUrl(
  storagePath: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const { data, error } = await supabase.storage
    .from('verification-documents')
    .createSignedUrl(storagePath, 600);
  if (error || !data?.signedUrl) {
    return { ok: false, error: error?.message || 'Could not generate secure document link.' };
  }
  return { ok: true, url: data.signedUrl };
}
