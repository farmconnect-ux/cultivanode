import { colors, formatNgPhone, isValidEmail, normalizeNgPhone, radius, space } from '@cultivanode/shared';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextInput } from 'react-native';
import { fill, useI18n } from '../i18n';
import { sendCode, sendEmailCode, verifyCode, verifyEmailCode, type AuthErrorKey } from '../lib/auth';
import { Button, Notice, Screen, Text, TextField } from '../ui';

const RESEND_SECONDS = 60;

type Props = { mode: 'signIn' | 'signUp'; onBack: () => void };

/** Two steps: phone or email, then the 6-digit code. A successful code signs in (App reacts to the session). */
export function PhoneSignInScreen({ mode, onBack }: Props) {
  const { t } = useI18n();
  const [step, setStep] = useState<'input' | 'code'>('input');
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [raw, setRaw] = useState('');
  const [target, setTarget] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const codeRef = useRef<TextInput>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const message = (key: AuthErrorKey) => (key === 'offline' ? t.common.offline : t.auth[key]);

  async function requestCode(dest: string, m: 'phone' | 'email') {
    setBusy(true);
    setError(null);
    const err = m === 'email' ? await sendEmailCode(dest) : await sendCode(dest);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setTarget(dest);
    setCode('');
    setStep('code');
    setSecondsLeft(RESEND_SECONDS);
    setTimeout(() => codeRef.current?.focus(), 300);
  }

  async function submitInput() {
    if (method === 'phone') {
      const normalized = normalizeNgPhone(raw);
      if (!normalized || normalized === 'invalid') {
        setError('errorPhone');
        return;
      }
      await requestCode(normalized, 'phone');
    } else {
      const clean = raw.trim().toLowerCase();
      if (!isValidEmail(clean)) {
        setError('errorEmail');
        return;
      }
      await requestCode(clean, 'email');
    }
  }

  async function submitCode() {
    setBusy(true);
    setError(null);
    const err = method === 'email' ? await verifyEmailCode(target, code) : await verifyCode(target, code);
    setBusy(false);
    if (err) setError(err);
    // On success the session appears and App moves on; nothing else to do here.
  }

  const title = mode === 'signUp' ? t.auth.signUpTitle : t.auth.signInTitle;

  if (step === 'input') {
    return (
      <Screen
        footer={
          <>
            <Button title={t.auth.sendCode} onPress={submitInput} loading={busy} />
            <Text variant="caption" muted>{t.auth.termsNote}</Text>
          </>
        }
      >
        <BackLink label={t.common.back} onPress={onBack} />
        <Text variant="title" color={colors.leaf[800]} accessibilityRole="header">{title}</Text>
        <Text muted>{mode === 'signUp' ? t.auth.signUpIntro : t.auth.signInIntro}</Text>

        <View style={styles.tabContainer} accessibilityRole="tablist">
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: method === 'phone' }}
            onPress={() => {
              setMethod('phone');
              setError(null);
            }}
            style={[styles.tab, method === 'phone' && styles.tabActive]}
          >
            <Text variant="label" color={method === 'phone' ? colors.leaf[800] : colors.muted}>
              {t.auth.usePhone}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: method === 'email' }}
            onPress={() => {
              setMethod('email');
              setError(null);
            }}
            style={[styles.tab, method === 'email' && styles.tabActive]}
          >
            <Text variant="label" color={method === 'email' ? colors.leaf[800] : colors.muted}>
              {t.auth.useEmail}
            </Text>
          </Pressable>
        </View>

        {method === 'phone' ? (
          <TextField
            label={t.auth.phone}
            hint={t.auth.phoneHint}
            value={raw}
            onChangeText={(v) => {
              setRaw(v);
              if (error) setError(null);
            }}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            maxLength={20}
            returnKeyType="send"
            onSubmitEditing={submitInput}
            error={error === 'errorPhone' ? t.auth.errorPhone : undefined}
            autoFocus
          />
        ) : (
          <TextField
            label={t.auth.email}
            hint={t.auth.emailHint}
            value={raw}
            onChangeText={(v) => {
              setRaw(v);
              if (error) setError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
            autoComplete="email"
            maxLength={100}
            returnKeyType="send"
            onSubmitEditing={submitInput}
            error={error === 'errorEmail' ? t.auth.errorEmail : undefined}
            autoFocus
          />
        )}
        {error && error !== 'errorPhone' && error !== 'errorEmail' ? <Notice>{message(error)}</Notice> : null}
      </Screen>
    );
  }

  const isEmail = method === 'email';

  return (
    <Screen footer={<Button title={t.auth.verify} onPress={submitCode} loading={busy} disabled={code.length < 6} />}>
      <BackLink
        label={isEmail ? t.auth.changeEmail : t.auth.changeNumber}
        onPress={() => {
          setStep('input');
          setError(null);
        }}
      />
      <Text variant="title" color={colors.leaf[800]} accessibilityRole="header">{title}</Text>
      <Text muted>
        {isEmail
          ? fill(t.auth.codeSentToEmail, { email: target })
          : fill(t.auth.codeSentTo, { phone: formatNgPhone(target) })}
      </Text>
      <TextField
        ref={codeRef}
        label={t.auth.code}
        value={code}
        onChangeText={(v) => {
          setCode(v.replace(/[^0-9]/g, '').slice(0, 6));
          if (error) setError(null);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={6}
        style={styles.code}
        returnKeyType="done"
        onSubmitEditing={submitCode}
      />
      {error ? <Notice>{message(error)}</Notice> : null}
      {secondsLeft > 0 ? (
        <Text variant="caption" muted accessibilityLiveRegion="polite">
          {fill(t.auth.resendIn, { seconds: secondsLeft })}
        </Text>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => requestCode(target, method)} disabled={busy} style={styles.link}>
          <Text variant="label" color={colors.leaf[700]}>{t.auth.resend}</Text>
        </Pressable>
      )}
    </Screen>
  );
}

export function BackLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.link} hitSlop={8}>
      <Text variant="label" color={colors.muted}>← {label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f4',
    borderRadius: radius.md,
    padding: 4,
    marginVertical: space[2],
  },
  tab: {
    flex: 1,
    paddingVertical: space[2],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  code: { fontSize: 28, letterSpacing: 10, textAlign: 'center', fontWeight: '700' },
  link: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
});
