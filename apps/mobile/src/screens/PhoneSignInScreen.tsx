import { formatNgPhone, isValidEmail, normalizeNgPhone } from '@cultivanode/shared';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextInput } from 'react-native';
import { fill, useI18n } from '../i18n';
import { sendCode, sendEmailCode, verifyCode, verifyEmailCode, type AuthErrorKey } from '../lib/auth';
import { color as c, space, tap } from '../theme';
import { Button, Header, Notice, Screen, Steps, Text, TextField } from '../ui';

const RESEND_SECONDS = 60;

type Props = { mode: 'signIn' | 'signUp'; onBack: () => void; onSignedIn: () => void };

/** Two steps: phone or email, then the 6-digit code. A successful code signs in (App reacts to the session). */
export function PhoneSignInScreen({ mode, onBack, onSignedIn }: Props) {
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
    if (err) {
      setError(err);
      return;
    }
    onSignedIn();
  }

  const title = mode === 'signUp' ? t.auth.signUpTitle : t.auth.signInTitle;

  if (step === 'input') {
    const other = method === 'phone' ? 'email' : 'phone';
    return (
      <Screen
        header={<Header onBack={onBack} backLabel={t.common.back} right={mode === 'signUp' ? <View style={styles.steps}><Steps n={1} of={4} /></View> : undefined} />}
        footer={
          <>
            <Button title={t.auth.sendCode} onPress={submitInput} loading={busy} icon="message-square" />
            <Text variant="caption" muted>{t.auth.termsNote}</Text>
          </>
        }
      >
        <Text variant="title" accessibilityRole="header">{title}</Text>
        <Text muted>{mode === 'signUp' ? t.auth.signUpIntro : t.auth.signInIntro}</Text>

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
            prefix="🇳🇬"
            placeholder="0803 123 4567"
            style={styles.phone}
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
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setMethod(other);
            setRaw('');
            setError(null);
          }}
          style={styles.link}
        >
          <Text variant="label" color={c.secondary}>{other === 'email' ? t.auth.useEmailInstead : t.auth.usePhoneInstead}</Text>
        </Pressable>
      </Screen>
    );
  }

  const isEmail = method === 'email';

  return (
    <Screen
      header={
        <Header
          onBack={() => {
            setStep('input');
            setError(null);
          }}
          backLabel={isEmail ? t.auth.changeEmail : t.auth.changeNumber}
          right={mode === 'signUp' ? <View style={styles.steps}><Steps n={2} of={4} /></View> : undefined}
        />
      }
      footer={<Button title={t.auth.verify} onPress={submitCode} loading={busy} disabled={code.length < 6} />}
    >
      <Text variant="title" accessibilityRole="header">{t.auth.code}</Text>
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
          setCode(v.replace(/[^0-9]/g, '').slice(0, 10));
          if (error) setError(null);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={10}
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
          <Text variant="label" color={c.secondary}>{t.auth.resend}</Text>
        </Pressable>
      )}
    </Screen>
  );
}

export function BackLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.link} hitSlop={8}>
      <Text variant="label" color={c.inkSoft}>← {label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  steps: { width: 120 },
  phone: { fontSize: 20, letterSpacing: 1 },
  code: { fontSize: 28, letterSpacing: 10, textAlign: 'center', fontFamily: 'Inter_700Bold' },
  link: { minHeight: tap, justifyContent: 'center', alignSelf: 'flex-start' },
});
