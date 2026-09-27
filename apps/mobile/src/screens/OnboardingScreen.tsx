import { colors, LEGAL_VERSION, NIGERIAN_STATES, PROVIDER_TYPES, space, type AppRole } from '@cultivanode/shared';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import { fill, useI18n, type Lang } from '../i18n';
import { loadRoleOptions, type RoleOption } from '../lib/account';
import { reportError } from '../lib/monitoring';
import {
  checkAboutYou,
  checkConsents,
  checkRoles,
  onboardingArgs,
  type OnboardingError,
  type OnboardingForm,
} from '../lib/onboarding';
import { siteLink } from '../lib/site';
import { supabase } from '../lib/supabase';
import { Button, Choice, Notice, Screen, SelectField, Text, TextField } from '../ui';
import { BackLink } from './PhoneSignInScreen';

type Props = {
  /** Called when the account is set up (or turns out to be set up already). */
  onDone: (welcome: boolean) => void;
  onSignedOut: () => void;
};

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'yo', label: 'Yorùbá' },
  { value: 'pcm', label: 'Naijá (Pidgin)' },
];

export function OnboardingScreen({ onDone, onSignedOut }: Props) {
  const { t, lang, setLang } = useI18n();
  const [step, setStep] = useState<1 | 2 | 3>(1);
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

  function toggleRole(role: AppRole) {
    set('roles', form.roles.includes(role) ? form.roles.filter((r) => r !== role) : [...form.roles, role]);
  }

  function next() {
    const err = step === 1 ? checkAboutYou(form) : checkRoles(form);
    if (err) {
      setError(err);
      return;
    }
    setStep(step === 1 ? 2 : 3);
  }

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
      onDone(true);
      return;
    }
    if (dbError.code === 'P0001') return onDone(false); // already set up
    if (dbError.code === '42501' || dbError.code === 'PGRST301') return onSignedOut();
    if (!dbError.code || /network|fetch/i.test(dbError.message)) {
      setError('offline');
      return;
    }
    reportError('onboarding_failed', dbError, { reason: dbError.code });
    setError('errorGeneric');
  }

  const errorText = error ? (error === 'offline' ? t.common.offline : t.onboarding[error]) : null;
  const o = t.onboarding;

  const footer =
    step < 3 ? (
      <Button title={o.next} onPress={next} disabled={step === 2 && !roleOptions} />
    ) : (
      <Button title={o.submit} onPress={submit} loading={saving} />
    );

  return (
    <Screen footer={footer}>
      {step > 1 ? <BackLink label={t.common.back} onPress={() => setStep(step === 3 ? 2 : 1)} /> : null}
      <View style={styles.progress} accessibilityLabel={fill(o.step, { n: step })}>
        {[1, 2, 3].map((n) => (
          <View key={n} style={[styles.bar, n <= step && styles.barOn]} />
        ))}
      </View>
      <Text variant="caption" muted>{fill(o.step, { n: step }).toUpperCase()}</Text>

      {step === 1 ? (
        <>
          <Text variant="title" color={colors.leaf[800]} accessibilityRole="header">{o.title}</Text>
          <Text muted>{o.intro}</Text>
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
          <Text variant="label">{o.accountType}</Text>
          <Choice
            kind="radio"
            title={o.individual}
            hint={o.individualHint}
            selected={form.accountType === 'individual'}
            onPress={() => set('accountType', 'individual')}
          />
          <Choice
            kind="radio"
            title={o.business}
            hint={o.businessHint}
            selected={form.accountType === 'business'}
            onPress={() => set('accountType', 'business')}
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
              <TextField
                label={o.cacNumber}
                value={form.cacNumber}
                onChangeText={(v) => set('cacNumber', v)}
                autoCapitalize="characters"
                maxLength={40}
              />
            </>
          ) : null}
          <SelectField
            label={o.state}
            placeholder={o.statePlaceholder}
            value={form.state}
            options={NIGERIAN_STATES.map((s) => ({ value: s, label: s }))}
            onChange={(v) => set('state', v)}
            closeLabel={t.common.close}
          />
          {form.state ? (
            <TextField label={o.lga} value={form.lga} onChangeText={(v) => set('lga', v)} maxLength={60} />
          ) : null}
          <SelectField
            label={o.language}
            placeholder="English"
            value={form.language}
            options={LANGUAGE_OPTIONS}
            onChange={(v) => set('language', v)}
            closeLabel={t.common.close}
          />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Text variant="title" color={colors.leaf[800]} accessibilityRole="header">{o.rolesTitle}</Text>
          <Text muted>{o.rolesIntro}</Text>
          {rolesFailed ? (
            <>
              <Notice>{o.errorRolesLoad}</Notice>
              <Button title={t.common.retry} variant="secondary" onPress={fetchRoles} />
            </>
          ) : !roleOptions ? (
            <ActivityIndicator color={colors.leaf[600]} accessibilityLabel={t.common.loading} />
          ) : (
            roleOptions.map((r) => (
              <View key={r.role} style={styles.roleBlock}>
                <Choice
                  title={t.roleNames[r.role]}
                  hint={t.roleHints[r.role]}
                  badge={r.auto_approve ? o.autoApproved : o.needsReview}
                  selected={form.roles.includes(r.role)}
                  onPress={() => toggleRole(r.role)}
                />
                {r.role === 'service_provider' && form.roles.includes('service_provider') ? (
                  <SelectField
                    label={o.providerType}
                    placeholder={o.providerType}
                    value={form.providerType}
                    options={PROVIDER_TYPES.map((p) => ({ value: p, label: t.providerTypes[p] }))}
                    onChange={(v) => set('providerType', v)}
                    closeLabel={t.common.close}
                    error={error === 'errorProviderType' ? o.errorProviderType : undefined}
                  />
                ) : null}
              </View>
            ))
          )}
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Text variant="title" color={colors.leaf[800]} accessibilityRole="header">{o.consentTitle}</Text>
          <Choice
            title={o.consentTerms}
            badge={o.required}
            selected={form.consents.terms_of_use}
            onPress={() => set('consents', { ...form.consents, terms_of_use: !form.consents.terms_of_use })}
          />
          <Choice
            title={o.consentPrivacy}
            badge={o.required}
            selected={form.consents.privacy_policy}
            onPress={() => set('consents', { ...form.consents, privacy_policy: !form.consents.privacy_policy })}
          />
          <Choice
            title={o.consentData}
            badge={o.optional}
            selected={form.consents.data_processing}
            onPress={() => set('consents', { ...form.consents, data_processing: !form.consents.data_processing })}
          />
          <Choice
            title={o.consentMarketing}
            badge={o.optional}
            selected={form.consents.marketing_messages}
            onPress={() =>
              set('consents', { ...form.consents, marketing_messages: !form.consents.marketing_messages })
            }
          />
          <View style={styles.links}>
            <LinkText label={o.readTerms} url={siteLink(lang, 'terms')} />
            <LinkText label={o.readPrivacy} url={siteLink(lang, 'privacy')} />
          </View>
        </>
      ) : null}

      {errorText && error !== 'errorName' && error !== 'errorBusiness' && error !== 'errorProviderType' ? (
        <Notice>{errorText}</Notice>
      ) : null}
    </Screen>
  );
}

function LinkText({ label, url }: { label: string; url: string }) {
  return (
    <Pressable accessibilityRole="link" onPress={() => Linking.openURL(url)} style={styles.link}>
      <Text variant="label" color={colors.leaf[700]} style={styles.underline}>{label} ↗</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', gap: space[2] },
  bar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.line },
  barOn: { backgroundColor: colors.leaf[600] },
  roleBlock: { gap: space[3] },
  links: { gap: space[1] },
  link: { minHeight: 44, justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
});
