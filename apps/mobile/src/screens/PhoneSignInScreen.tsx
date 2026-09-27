import { colors, formatNgPhone, normalizeNgPhone, space } from '@cultivanode/shared';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, type TextInput } from 'react-native';
import { fill, useI18n } from '../i18n';
import { sendCode, verifyCode, type AuthErrorKey } from '../lib/auth';
import { Button, Notice, Screen, Text, TextField } from '../ui';

const RESEND_SECONDS = 60;

type Props = { mode: 'signIn' | 'signUp'; onBack: () => void };

/** Two steps: phone number, then the 6-digit code. A successful code signs in (App reacts to the session). */
export function PhoneSignInScreen({ mode, onBack }: Props) {
  const { t } = useI18n();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [raw, setRaw] = useState('');
  const [phone, setPhone] = useState('');
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

  async function requestCode(target: string) {
    setBusy(true);
    setError(null);
    const err = await sendCode(target);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setPhone(target);
    setCode('');
    setStep('code');
    setSecondsLeft(RESEND_SECONDS);
    setTimeout(() => codeRef.current?.focus(), 300);
  }

  async function submitPhone() {
    const normalized = normalizeNgPhone(raw);
    if (!normalized || normalized === 'invalid') {
      setError('errorPhone');
      return;
    }
    await requestCode(normalized);
  }

  async function submitCode() {
    setBusy(true);
    setError(null);
    const err = await verifyCode(phone, code);
    setBusy(false);
    if (err) setError(err);
    // On success the session appears and App moves on; nothing else to do here.
  }

  const title = mode === 'signUp' ? t.auth.signUpTitle : t.auth.signInTitle;

  if (step === 'phone') {
    return (
      <Screen
        footer={
          <>
            <Button title={t.auth.sendCode} onPress={submitPhone} loading={busy} />
            <Text variant="caption" muted>{t.auth.termsNote}</Text>
          </>
        }
      >
        <BackLink label={t.common.back} onPress={onBack} />
        <Text variant="title" color={colors.leaf[800]} accessibilityRole="header">{title}</Text>
        <Text muted>{mode === 'signUp' ? t.auth.signUpIntro : t.auth.signInIntro}</Text>
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
          onSubmitEditing={submitPhone}
          error={error === 'errorPhone' ? t.auth.errorPhone : undefined}
          autoFocus
        />
        {error && error !== 'errorPhone' ? <Notice>{message(error)}</Notice> : null}
      </Screen>
    );
  }

  return (
    <Screen footer={<Button title={t.auth.verify} onPress={submitCode} loading={busy} disabled={code.length < 6} />}>
      <BackLink
        label={t.auth.changeNumber}
        onPress={() => {
          setStep('phone');
          setError(null);
        }}
      />
      <Text variant="title" color={colors.leaf[800]} accessibilityRole="header">{title}</Text>
      <Text muted>{fill(t.auth.codeSentTo, { phone: formatNgPhone(phone) })}</Text>
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
        <Pressable accessibilityRole="button" onPress={() => requestCode(phone)} disabled={busy} style={styles.link}>
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
  code: { fontSize: 28, letterSpacing: 10, textAlign: 'center', fontWeight: '700' },
  link: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
});
