import { LEGAL_VERSION } from '@cultivanode/shared';
import { useState } from 'react';
import { useI18n } from '../i18n';
import { verifyNin, type NinError } from '../lib/hire';
import { useSession } from '../lib/session';
import { Button, Choice, Header, Notice, Screen, Text, TextField } from '../ui';

/** Confirm your NIN (tier 1), once. The consent is asked here, where it is needed. */
export function VerifyNinScreen({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { t } = useI18n();
  const h = t.hire;
  const { account, refresh } = useSession();
  const [nin, setNin] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<NinError | null>(null);
  const [busy, setBusy] = useState(false);

  async function check() {
    setBusy(true);
    setError(null);
    const res = await verifyNin(nin, consent, LEGAL_VERSION);
    setBusy(false);
    if ('error' in res) return setError(res.error);
    await refresh();
    onDone();
  }

  return (
    <Screen
      header={<Header onBack={onBack} backLabel={t.common.back} title={h.ninTitle} />}
      footer={<Button title={t.me.verify} icon="shield" onPress={check} loading={busy} disabled={!consent || nin.replace(/\s/g, '').length !== 11} />}
    >
      <Text muted>{h.ninBody}</Text>
      {account?.profile.full_name ? <Text variant="label">{account.profile.full_name}</Text> : null}
      <TextField label={h.nin} value={nin} onChangeText={(v) => setNin(v.replace(/[^0-9 ]/g, '').slice(0, 13))} keyboardType="number-pad" maxLength={13} />
      <Choice title={h.ninConsent} selected={consent} onPress={() => setConsent(!consent)} />
      {error ? <Notice>{h.ninErrors[error]}</Notice> : null}
    </Screen>
  );
}
