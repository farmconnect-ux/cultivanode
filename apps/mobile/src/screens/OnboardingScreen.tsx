import { LEGAL_VERSION, NIGERIAN_STATES, PROVIDER_TYPES, type AppRole } from '@cultivanode/shared';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useI18n, type Lang } from '../i18n';
import { loadRoleOptions, type RoleOption } from '../lib/account';
import { reportError } from '../lib/monitoring';
import { checkAboutYou, checkConsents, checkRoles, onboardingArgs, type OnboardingError, type OnboardingForm } from '../lib/onboarding';
import { siteLink } from '../lib/site';
import { supabase } from '../lib/supabase';
import { color as c, space, tap } from '../theme';
import { Button, Chips, Choice, Header, Loading, Notice, Screen, SelectField, Steps, Text, TextField, type IconName } from '../ui';

type Props = {
  /** Called when the account is set up (or turns out to be set up already). */
  onDone: () => void;
  onSignedOut: () => void;
};

const ROLE_ICONS: Partial<Record<AppRole, IconName>> = {
  crop_farmer: 'sun',
  animal_farmer: 'feather',
  machinery_owner: 'truck',
  service_provider: 'tool',
  customer: 'shopping-bag',
  input_supplier: 'package',
  buyer_offtaker: 'briefcase',
  logistics_provider: 'navigation',
  field_agent: 'users',
  institutional_partner: 'award',
  investor: 'trending-up',
};

/** "Tell us about you": name, what you do, where, and the agreement. One screen, then the farm. */
export function OnboardingScreen({ onDone, onSignedOut }: Props) {
  const { t, lang, setLang } = useI18n();
  const [form, setForm] = useState<OnboardingForm>({
    fullName: '',
    accountType: 'individual',
    businessName: '',
    cacNumber: '',
    state: '',
    lga: '',
    language: lang,
    roles: [],
    providerType: '',
    consents: { terms_of_use: false, privacy_policy: false, data_processing: false, marketing_messages: false },
  });
  const [error, setError] = useState<OnboardingError | 'errorGeneric' | 'offline' | null>(null);
  const [roleOptions, setRoleOptions] = useState<RoleOption[] | null>(null);
  const [rolesFailed, setRolesFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
  };

  const fetchRoles = useCallback(() => {
    setRolesFailed(false);
    loadRoleOptions()
      .then(setRoleOptions)
      .catch(() => setRolesFailed(true));
  }, []);

  useEffect(fetchRoles, [fetchRoles]);
  useEffect(() => setForm((f) => ({ ...f, language: lang })), [lang]);

  function toggleRole(role: AppRole) {
    set('roles', form.roles.includes(role) ? form.roles.filter((r) => r !== role) : [...form.roles, role]);
  }

  const agreed = form.consents.terms_of_use && form.consents.privacy_policy;

  async function submit() {
    const err = checkAboutYou(form) ?? checkRoles(form) ?? checkConsents(form);
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    const { error: dbError } = await supabase.rpc('complete_onboarding', onboardingArgs(form, LEGAL_VERSION));
    setSaving(false);
    if (!dbError) {
      if (form.language === 'en' || form.language === 'yo') setLang(form.language as Lang);
      onDone();
      return;
    }
    if (dbError.code === 'P0001') return onDone(); // already set up
    if (dbError.code === '42501' || dbError.code === 'PGRST301') return onSignedOut();
    if (!dbError.code || /network|fetch/i.test(dbError.message)) {
      setError('offline');
      return;
    }
    reportError('onboarding_failed', dbError, { reason: dbError.code });
    setError('errorGeneric');
  }

  const o = t.onboarding;
  const s = t.setup;
  const errorText = error ? (error === 'offline' ? t.common.offline : o[error]) : null;
  const inline = error === 'errorName' || error === 'errorBusiness' || error === 'errorProviderType';

  return (
    <Screen
      header={<Header backLabel={t.common.back} right={<View style={styles.steps}><Steps n={3} of={4} /></View>} />}
      footer={<Button title={s.continue} onPress={submit} loading={saving} disabled={!roleOptions} icon="arrow-right" />}
    >
      <Text variant="title" accessibilityRole="header">{s.title}</Text>
      <Text muted>{s.intro}</Text>

      <TextField
        label={o.fullName}
        hint={o.fullNameHint}
        value={form.fullName}
        onChangeText={(v) => set('fullName', v)}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        maxLength={120}
        error={error === 'errorName' ? o.errorName : undefined}
      />

      <View style={styles.group}>
        <Text variant="heading">{s.whatYouDo}</Text>
        <Text variant="caption" muted>{s.whatYouDoHint}</Text>
      </View>
      {rolesFailed ? (
        <>
          <Notice>{o.errorRolesLoad}</Notice>
          <Button title={t.common.retry} variant="secondary" onPress={fetchRoles} />
        </>
      ) : !roleOptions ? (
        <Loading label={t.common.loading} />
      ) : (
        roleOptions.map((r) => (
          <View key={r.role} style={styles.group}>
            <Choice
              icon={ROLE_ICONS[r.role] ?? 'circle'}
              title={t.roleSimple[r.role] ?? t.roleNames[r.role]}
              badge={r.auto_approve ? undefined : o.needsReview}
              selected={form.roles.includes(r.role)}
              onPress={() => toggleRole(r.role)}
            />
            {!r.auto_approve && form.roles.includes(r.role) ? (
              <Text variant="caption" muted style={styles.indent}>
                {r.requires_documents ? 'Requires staff review and verification documents after setup.' : 'Requires staff review after setup.'}
                {r.min_verification_tier > 0 ? ` Minimum Tier ${r.min_verification_tier} (NIN) verification required.` : ''}
              </Text>
            ) : null}
            {r.role === 'service_provider' && form.roles.includes('service_provider') ? (
              <View style={styles.indent}>
                <Text variant="label">{o.providerType}</Text>
                <Chips
                  label={o.providerType}
                  value={form.providerType || null}
                  onChange={(v) => set('providerType', v)}
                  options={PROVIDER_TYPES.map((p) => ({ value: p, label: t.providerTypes[p] }))}
                />
                {error === 'errorProviderType' ? <Text variant="caption" color={c.danger}>{o.errorProviderType}</Text> : null}
              </View>
            ) : null}
          </View>
        ))
      )}

      <Text variant="heading" style={styles.top}>{s.where}</Text>
      <SelectField
        label={o.state}
        placeholder={o.statePlaceholder}
        value={form.state}
        options={NIGERIAN_STATES.map((st) => ({ value: st, label: st }))}
        onChange={(v) => set('state', v)}
        closeLabel={t.common.close}
      />
      {form.state ? <TextField label={o.lga} value={form.lga} onChangeText={(v) => set('lga', v)} maxLength={60} /> : null}

      <Choice
        title={s.business}
        hint={s.businessHint}
        selected={form.accountType === 'business'}
        onPress={() => set('accountType', form.accountType === 'business' ? 'individual' : 'business')}
      />
      {form.accountType === 'business' ? (
        <>
          <TextField
            label={o.businessName}
            value={form.businessName}
            onChangeText={(v) => set('businessName', v)}
            maxLength={160}
            error={error === 'errorBusiness' ? o.errorBusiness : undefined}
          />
          <TextField label={o.cacNumber} value={form.cacNumber} onChangeText={(v) => set('cacNumber', v)} autoCapitalize="characters" maxLength={40} />
        </>
      ) : null}

      <View style={styles.agree}>
        <Choice
          title={s.agree}
          selected={agreed}
          onPress={() => set('consents', { ...form.consents, terms_of_use: !agreed, privacy_policy: !agreed })}
        />
        <View style={styles.links}>
          <LinkText label={s.readTerms} url={siteLink(lang, 'terms')} />
          <LinkText label={s.readPrivacy} url={siteLink(lang, 'privacy')} />
        </View>
        <Choice
          title={s.tips}
          selected={form.consents.marketing_messages}
          onPress={() => set('consents', { ...form.consents, marketing_messages: !form.consents.marketing_messages })}
        />
      </View>

      {errorText && !inline ? <Notice>{errorText}</Notice> : null}
    </Screen>
  );
}

function LinkText({ label, url }: { label: string; url: string }) {
  return (
    <Pressable accessibilityRole="link" onPress={() => Linking.openURL(url)} style={styles.link}>
      <Text variant="label" color={c.secondary} style={styles.underline}>{label} ↗</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  steps: { width: 120 },
  group: { gap: space[2] },
  indent: { gap: space[2], paddingLeft: space[2] },
  top: { marginTop: space[2] },
  agree: { gap: space[2], marginTop: space[2] },
  links: { flexDirection: 'row', gap: space[5], paddingLeft: space[1] },
  link: { minHeight: tap - 8, justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
});
