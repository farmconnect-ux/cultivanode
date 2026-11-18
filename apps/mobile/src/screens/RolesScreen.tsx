import { PROVIDER_TYPE_LABELS, type AppRole, type ProviderType } from '@cultivanode/shared';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { useI18n } from '../i18n';
import {
  availableProviderTypesForRequest,
  cancelRoleRequest,
  canRequestRoleWithTier,
  formatRoleLabel,
  getRequestableRoles,
  getVerificationDocumentSignedUrl,
  loadRoleOptions,
  loadRoleRequests,
  loadVerificationDocuments,
  requestRole,
  uploadVerificationDocument,
  type RoleOption,
  type RoleRequestRecord,
  type VerificationDocumentRecord,
  type VerificationDocumentType,
} from '../lib/account';
import { useSession } from '../lib/session';
import { color as c, space } from '../theme';
import { Button, Card, Header, Loading, Notice, Pill, Screen, SectionTitle, SelectField, Text, TextField } from '../ui';

const PROVIDER_TYPES: { value: ProviderType; label: string }[] = (
  Object.entries(PROVIDER_TYPE_LABELS) as [ProviderType, string][]
).map(([value, label]) => ({ value, label }));

const DOC_TYPES: { value: VerificationDocumentType; label: string }[] = [
  { value: 'national_id', label: 'National ID (NIN slip)' },
  { value: 'cac_certificate', label: 'CAC certificate' },
  { value: 'proof_of_address', label: 'Proof of address' },
  { value: 'equipment_ownership', label: 'Equipment ownership' },
  { value: 'professional_licence', label: 'Professional licence' },
  { value: 'photo', label: 'Photo' },
  { value: 'other', label: 'Other' },
];

export function RolesScreen({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const { session, account, refresh: refreshSession } = useSession();
  const userId = session?.user.id ?? null;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [options, setOptions] = useState<RoleOption[]>([]);
  const [requests, setRequests] = useState<RoleRequestRecord[]>([]);
  const [docs, setDocs] = useState<VerificationDocumentRecord[]>([]);

  const [selectedRole, setSelectedRole] = useState<AppRole | ''>('');
  const [providerType, setProviderType] = useState<ProviderType>('agronomist');
  const [note, setNote] = useState('');
  const [submittingRole, setSubmittingRole] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [docType, setDocType] = useState<VerificationDocumentType>('national_id');
  const [uploadingForReqId, setUploadingForReqId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const loadAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [opts, reqs, docRows] = await Promise.all([
        loadRoleOptions(),
        loadRoleRequests(userId),
        loadVerificationDocuments(userId),
      ]);
      setOptions(opts);
      setRequests(reqs);
      setDocs(docRows);
    } catch (err) {
      setLoadError((err as Error)?.message || 'Could not load roles and documents.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const availableServiceTypes = useMemo(() => {
    const allowed = new Set(
      availableProviderTypesForRequest(
        account?.roles ?? [],
        requests,
        PROVIDER_TYPES.map((p) => p.value),
      ),
    );
    return PROVIDER_TYPES.filter((p) => allowed.has(p.value));
  }, [account?.roles, requests]);

  const requestable = useMemo(
    () =>
      getRequestableRoles(
        options,
        account?.roles ?? [],
        requests,
        PROVIDER_TYPES.map((p) => p.value),
      ),
    [options, account?.roles, requests],
  );

  useEffect(() => {
    if ((!selectedRole || !requestable.some((r) => r.role === selectedRole)) && requestable.length > 0) {
      setSelectedRole(requestable[0].role);
    }
  }, [requestable, selectedRole]);

  useEffect(() => {
    if (availableServiceTypes.length > 0 && !availableServiceTypes.some((p) => p.value === providerType)) {
      setProviderType(availableServiceTypes[0].value);
    }
  }, [availableServiceTypes, providerType]);

  async function handleSubmitRole() {
    if (!selectedRole || submittingRole) return;
    setSubmittingRole(true);
    setFeedback(null);
    const res = await requestRole({
      role: selectedRole,
      providerType: selectedRole === 'service_provider' ? providerType : null,
      note,
    });
    setSubmittingRole(false);
    if (!res.ok) {
      setFeedback({ tone: 'error', text: res.error });
      return;
    }
    setNote('');
    setFeedback({ tone: 'success', text: 'Role request submitted.' });
    await Promise.all([refreshSession(), loadAll()]);
  }

  async function handleCancelRequest(requestId: string) {
    if (cancellingId) return;
    setCancellingId(requestId);
    setFeedback(null);
    const res = await cancelRoleRequest(requestId);
    setCancellingId(null);
    if (!res.ok) {
      setFeedback({ tone: 'error', text: res.error });
      return;
    }
    setFeedback({ tone: 'success', text: 'Role request cancelled.' });
    await Promise.all([refreshSession(), loadAll()]);
  }

  async function handlePickAndUpload(roleRequestId: string | null, fromCamera: boolean) {
    if (!userId || uploadingForReqId) return;
    try {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Please grant camera or gallery permission to upload a document.');
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });

      if (result.canceled || !result.assets[0]?.uri) return;
      const asset = result.assets[0];
      const mime = asset.mimeType || 'image/jpeg';

      setUploadingForReqId(roleRequestId ?? 'general');
      setFeedback(null);
      const uploaded = await uploadVerificationDocument({
        userId,
        roleRequestId,
        documentType: docType,
        uri: asset.uri,
        mimeType: mime,
        sizeBytes: asset.fileSize,
      });
      setUploadingForReqId(null);

      if (!uploaded.ok) {
        setFeedback({ tone: 'error', text: uploaded.error });
        return;
      }
      setFeedback({ tone: 'success', text: 'Document uploaded and queued for review.' });
      await loadAll();
    } catch {
      setUploadingForReqId(null);
      setFeedback({ tone: 'error', text: 'Could not upload document. Please try again.' });
    }
  }

  async function handlePickDocumentAndUpload(roleRequestId: string | null) {
    if (!userId || uploadingForReqId) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const asset = result.assets[0];
      const mime = asset.mimeType || 'application/pdf';

      setUploadingForReqId(roleRequestId ?? 'general');
      setFeedback(null);
      const uploaded = await uploadVerificationDocument({
        userId,
        roleRequestId,
        documentType: docType,
        uri: asset.uri,
        mimeType: mime,
        sizeBytes: asset.size,
      });
      setUploadingForReqId(null);

      if (!uploaded.ok) {
        setFeedback({ tone: 'error', text: uploaded.error });
        return;
      }
      setFeedback({ tone: 'success', text: 'Document uploaded and queued for review.' });
      await loadAll();
    } catch {
      setUploadingForReqId(null);
      setFeedback({ tone: 'error', text: 'Could not upload document. Please try again.' });
    }
  }

  async function handleOpenDoc(storagePath: string) {
    const res = await getVerificationDocumentSignedUrl(storagePath);
    if (!res.ok) {
      Alert.alert('Unavailable', res.error);
      return;
    }
    await Linking.openURL(res.url);
  }

  if (loading) {
    return (
      <Screen>
        <Header title="Roles & Documents" onBack={onBack} backLabel="Back" />
        <Loading label="Loading roles and documents..." />
      </Screen>
    );
  }

  const chosenOption = options.find((o) => o.role === selectedRole);
  const currentTier = account?.profile.verification_tier ?? 0;
  const tierMet = canRequestRoleWithTier(chosenOption, currentTier);

  return (
    <Screen>
      <Header title="Roles & Documents" onBack={onBack} backLabel="Back" />

      {feedback ? <Notice tone={feedback.tone}>{feedback.text}</Notice> : null}
      {loadError ? (
        <Card>
          <Notice tone="warning">{loadError}</Notice>
          <Button title="Retry" onPress={loadAll} />
        </Card>
      ) : null}

      <SectionTitle title="Active roles" />
      <Card>
        <View style={styles.pills}>
          {(account?.roles ?? []).map((r) => (
            <Pill key={`${r.role}-${r.provider_type ?? ''}`} tone="green">
              {formatRoleLabel(r.role, r.provider_type, { ...t.roleNames, ...t.roleSimple }, t.providerTypes)}
            </Pill>
          ))}
        </View>
      </Card>

      {requestable.length > 0 ? (
        <>
          <SectionTitle title="Request another role" />
          <Card>
            <SelectField
              label="Role"
              placeholder="Select a role"
              closeLabel="Close"
              value={selectedRole}
              options={requestable.map((r) => ({
                value: r.role,
                label: t.roleSimple[r.role] ?? t.roleNames[r.role] ?? r.role,
              }))}
              onChange={(v) => setSelectedRole(v as AppRole)}
            />
            {selectedRole === 'service_provider' ? (
              <SelectField
                label="Service speciality"
                placeholder="Select speciality"
                closeLabel="Close"
                value={providerType}
                options={availableServiceTypes}
                onChange={(v) => setProviderType(v as ProviderType)}
              />
            ) : null}
            {chosenOption ? (
              <Text variant="caption" muted>
                {chosenOption.auto_approve
                  ? 'Approved immediately.'
                  : chosenOption.requires_documents
                    ? `Requires staff review and supporting documents (Tier ${chosenOption.min_verification_tier}+).`
                    : `Requires staff review (Tier ${chosenOption.min_verification_tier}+).`}
              </Text>
            ) : null}
            {chosenOption && !tierMet ? (
              <Notice tone="warning">
                Requires Verification Tier {chosenOption.min_verification_tier}+ (your current tier is {currentTier}). Complete NIN verification before this role can be approved.
              </Notice>
            ) : null}
            <TextField
              label="Notes (optional)"
              value={note}
              onChangeText={setNote}
              placeholder="Briefly describe your farm, equipment, or business"
              maxLength={500}
            />
            <Button
              title="Submit role request"
              onPress={handleSubmitRole}
              loading={submittingRole}
              disabled={submittingRole || !selectedRole}
            />
          </Card>
        </>
      ) : null}

      <SectionTitle title={`Role requests (${requests.length})`} />
      {requests.length === 0 ? (
        <Card>
          <Text variant="caption" muted>No role requests submitted yet.</Text>
        </Card>
      ) : (
        requests.map((req) => {
          const reqDocs = docs.filter((d) => d.role_request_id === req.id);
          const rule = options.find((o) => o.role === req.role);
          return (
            <Card key={req.id}>
              <View style={styles.rowBetween}>
                <Text variant="label">
                  {t.roleSimple[req.role] ?? t.roleNames[req.role] ?? req.role}
                  {req.provider_type ? ` (${req.provider_type})` : ''}
                </Text>
                <Pill tone={req.status === 'approved' ? 'green' : req.status === 'rejected' ? 'amber' : 'grey'}>
                  {req.status.toUpperCase()}
                </Pill>
              </View>
              <Text variant="caption" muted>Submitted {new Date(req.created_at).toLocaleDateString()}</Text>
              {req.review_note ? <Notice tone={req.status === 'rejected' ? 'error' : 'info'}>{req.review_note}</Notice> : null}

              {reqDocs.map((d) => (
                <View key={d.id} style={styles.docRow}>
                  <View style={styles.flex}>
                    <Text variant="caption">{d.document_type.replace(/_/g, ' ')} · {d.status}</Text>
                    {d.review_note ? <Text variant="caption" color={c.danger}>{d.review_note}</Text> : null}
                  </View>
                  <Button title="View" variant="secondary" onPress={() => handleOpenDoc(d.storage_path)} />
                </View>
              ))}

              {req.status === 'pending' && rule?.requires_documents ? (
                <View style={styles.uploadBox}>
                  <SelectField
                    label="Document type"
                    placeholder="Select document type"
                    closeLabel="Close"
                    value={docType}
                    options={DOC_TYPES}
                    onChange={(v) => setDocType(v as VerificationDocumentType)}
                  />
                  <View style={styles.rowGap}>
                    <View style={styles.flex}>
                      <Button
                        title="Take photo"
                        variant="secondary"
                        onPress={() => handlePickAndUpload(req.id, true)}
                        loading={uploadingForReqId === req.id}
                        disabled={Boolean(uploadingForReqId)}
                      />
                    </View>
                    <View style={styles.flex}>
                      <Button
                        title="Choose image"
                        variant="secondary"
                        onPress={() => handlePickAndUpload(req.id, false)}
                        loading={uploadingForReqId === req.id}
                        disabled={Boolean(uploadingForReqId)}
                      />
                    </View>
                  </View>
                  <Button
                    title="Choose PDF / file"
                    variant="secondary"
                    onPress={() => handlePickDocumentAndUpload(req.id)}
                    loading={uploadingForReqId === req.id}
                    disabled={Boolean(uploadingForReqId)}
                  />
                </View>
              ) : null}

              {req.status === 'pending' ? (
                <Button
                  title="Cancel request"
                  variant="secondary"
                  onPress={() => handleCancelRequest(req.id)}
                  loading={cancellingId === req.id}
                  disabled={Boolean(cancellingId)}
                />
              ) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space[2] },
  rowGap: { flexDirection: 'row', gap: space[2] },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], borderTopWidth: 1, borderTopColor: c.outline, paddingTop: space[2] },
  uploadBox: { gap: space[2], borderTopWidth: 1, borderTopColor: c.outline, paddingTop: space[2] },
  flex: { flex: 1 },
});
