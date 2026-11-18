import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { deleteMyAccount, isRecentSignIn } from '../lib/account';
import { sendCode, sendEmailCode, signOut, verifyCode, verifyEmailCode } from '../lib/auth';
import { useSession } from '../lib/session';
import { space } from '../theme';
import { Button, Card, Header, Notice, Screen, SectionTitle, Text, TextField } from '../ui';

type Props = {
  onBack: () => void;
  onDeleted: () => void;
};

/** Self-service permanent account deletion with re-authentication and financial/shared safeguards. */
export function AccountDeleteScreen({ onBack, onDeleted }: Props) {
  const { session, account } = useSession();
  const userId = session?.user.id ?? '';
  const phone = account?.profile.phone ?? session?.user.phone?.replace(/^\+/, '') ?? '';
  const email = session?.user.email ?? '';

  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [reauthing, setReauthing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'error' | 'warning' | 'success'; text: string } | null>(null);

  const recentSession = isRecentSignIn(session?.user.last_sign_in_at);

  async function handleSendReauthCode() {
    if (reauthing) return;
    setReauthing(true);
    setFeedback(null);
    const err = phone ? await sendCode(phone) : email ? await sendEmailCode(email) : 'errorSend';
    setReauthing(false);
    if (err) {
      setFeedback({ tone: 'error', text: 'Could not send a verification code. Check your signal and try again.' });
      return;
    }
    setOtpSent(true);
    setFeedback({ tone: 'success', text: 'Verification code sent. Enter the 6-digit code to continue.' });
  }

  async function handleVerifyReauthCode() {
    if (reauthing) return;
    setReauthing(true);
    setFeedback(null);
    const err = phone
      ? await verifyCode(phone, otpCode)
      : email
        ? await verifyEmailCode(email, otpCode)
        : 'errorWrongCode';
    setReauthing(false);
    if (err) {
      setFeedback({ tone: 'error', text: 'Invalid or expired verification code. Please try again.' });
      return;
    }
    setOtpSent(false);
    setOtpCode('');
    setFeedback({ tone: 'success', text: 'Identity verified. You can now confirm account deletion.' });
  }

  async function executeDeletion() {
    if (!userId || !session?.access_token || deleting) return;
    setDeleting(true);
    setFeedback(null);
    const outcome = await deleteMyAccount({
      userId,
      confirmation,
      reason,
      accessToken: session.access_token,
    });
    setDeleting(false);

    if (!outcome.ok) {
      setFeedback({
        tone: outcome.code === 'deletion_blocked' || outcome.code === 'reauth_required' ? 'warning' : 'error',
        text: outcome.error,
      });
      return;
    }

    await signOut('local');
    Alert.alert(
      'Account deleted',
      'Your CultivaNode login and personal profile have been permanently removed.',
      [{ text: 'OK', onPress: onDeleted }],
    );
    onDeleted();
  }

  function handleConfirmPress() {
    if (confirmation.trim() !== 'DELETE') {
      setFeedback({ tone: 'error', text: 'Type DELETE in capital letters to confirm.' });
      return;
    }
    Alert.alert(
      'Permanently delete account?',
      'This cannot be undone. Your login, personal details, role requests, and uploaded verification documents will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete permanently', style: 'destructive', onPress: executeDeletion },
      ],
    );
  }

  return (
    <Screen>
      <Header title="Delete account" onBack={onBack} backLabel="Back" />

      {feedback ? <Notice tone={feedback.tone}>{feedback.text}</Notice> : null}

      <SectionTitle title="What happens when you delete your account" />
      <Card>
        <View style={styles.list}>
          <Text variant="small">
            • Your Supabase Auth login, phone/email credentials, active sessions, notifications, calendar feeds, role requests, and saved bank payout details are permanently removed.
          </Text>
          <Text variant="small">
            • Uploaded identity and verification documents in private Storage are deleted.
          </Text>
          <Text variant="small">
            • Financial ledger entries, payment/settlement/escrow records, completed booking/order history, and shared organization records are anonymized and retained for accounting, fraud prevention, and dispute resolution.
          </Text>
          <Text variant="small">
            • Accounts with active bookings, in-flight marketplace orders, held escrows, or pending settlements cannot be deleted until those commitments settle.
          </Text>
        </View>
      </Card>

      {!recentSession ? (
        <>
          <SectionTitle title="Step 1: Verify your identity" />
          <Card>
            <Notice tone="warning">
              For your security, deleting your account requires a sign-in within the last 15 minutes.
            </Notice>
            {!otpSent ? (
              <Button
                title="Send verification code"
                onPress={handleSendReauthCode}
                loading={reauthing}
                disabled={!phone && !email}
              />
            ) : (
              <>
                <TextField
                  label="6-digit verification code"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={10}
                />
                <Button title="Verify code" onPress={handleVerifyReauthCode} loading={reauthing} />
              </>
            )}
          </Card>
        </>
      ) : null}

      <SectionTitle title="Final confirmation" />
      <Card>
        <TextField
          label="Reason for leaving (optional)"
          value={reason}
          onChangeText={setReason}
          placeholder="Tell us why you are deleting your account"
          maxLength={1000}
        />
        <TextField
          label="Type DELETE to confirm"
          value={confirmation}
          onChangeText={setConfirmation}
          autoCapitalize="characters"
          placeholder="DELETE"
          maxLength={12}
        />
        <Button
          title="Delete my account permanently"
          variant="danger"
          onPress={handleConfirmPress}
          loading={deleting}
          disabled={!recentSession || confirmation.trim() !== 'DELETE' || deleting}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: space[2] },
});
