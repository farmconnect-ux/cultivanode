import { NIGERIAN_STATES } from '@cultivanode/shared';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useI18n } from '../i18n';
import { addFarm, type FarmError, type NewFarm } from '../lib/farm';
import { color as c, space } from '../theme';
import { Button, Card, Chips, Header, Icon, Notice, Screen, SelectField, Steps, Text, TextField } from '../ui';

type Props = { userId: string; defaultState?: string | null; onSaved: (farmId: string) => void; onBack?: () => void; firstTime: boolean };

/** Add a farm: a name, where it is (GPS or the state), and optionally its size. */
export function FarmSetupScreen({ userId, defaultState, onSaved, onBack, firstTime }: Props) {
  const { t } = useI18n();
  const f = t.farmSetup;
  const [form, setForm] = useState<NewFarm>({ name: '', state: defaultState ?? '', lga: '', size: '', unit: 'ha', lat: null, lng: null });
  const [gps, setGps] = useState<'idle' | 'working' | 'saved' | 'failed'>('idle');
  const [error, setError] = useState<FarmError | null>(null);
  const [saving, setSaving] = useState(false);

  // The profile can arrive after the first render: fill in the state the person gave at sign-up.
  useEffect(() => {
    if (defaultState) setForm((x) => (x.state ? x : { ...x, state: defaultState }));
  }, [defaultState]);

  const set = <K extends keyof NewFarm>(k: K, v: NewFarm[K]) => {
    setForm((x) => ({ ...x, [k]: v }));
    setError(null);
  };

  async function useLocation() {
    setGps('working');
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') throw new Error('denied');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setForm((x) => ({ ...x, lat: pos.coords.latitude, lng: pos.coords.longitude }));
      setGps('saved');
      setError(null);
    } catch {
      setGps('failed');
    }
  }

  async function save() {
    setSaving(true);
    const res = await addFarm(userId, form);
    setSaving(false);
    if ('error' in res) {
      setError(res.error);
      return;
    }
    onSaved(res.id);
  }

  const message = error ? (error === 'offline' ? t.common.offline : f[error]) : null;

  return (
    <Screen
      header={<Header onBack={onBack} backLabel={t.common.back} right={firstTime ? <View style={styles.steps}><Steps n={4} of={4} /></View> : undefined} />}
      footer={<Button title={f.save} onPress={save} loading={saving} icon="check" />}
    >
      <Text variant="title" accessibilityRole="header">{f.title}</Text>
      <Text muted>{f.intro}</Text>

      <TextField
        label={f.name}
        placeholder={f.namePlaceholder}
        value={form.name}
        onChangeText={(v) => set('name', v)}
        autoCapitalize="words"
        maxLength={120}
        error={error === 'errorName' ? f.errorName : undefined}
      />

      <Text variant="heading" style={styles.top}>{f.where}</Text>
      {gps === 'saved' && form.lat !== null && form.lng !== null ? (
        <Card tone="soft">
          <View style={styles.gpsRow}>
            <View style={styles.gpsIcon}>
              <Icon name="check-circle" size={24} />
            </View>
            <View style={styles.flex}>
              <Text variant="label">{f.gpsSaved}</Text>
              <Text variant="caption" muted>{`${form.lat.toFixed(5)}, ${form.lng.toFixed(5)}`}</Text>
            </View>
          </View>
        </Card>
      ) : (
        <View style={styles.group}>
          <Button title={gps === 'working' ? f.gpsWorking : f.useGps} variant="secondary" icon="crosshair" loading={gps === 'working'} onPress={useLocation} />
          <Text variant="caption" muted>{f.useGpsHint}</Text>
          {gps === 'failed' ? <Notice tone="warning">{f.gpsFailed}</Notice> : null}
        </View>
      )}

      <SelectField
        label={t.onboarding.state}
        placeholder={t.onboarding.statePlaceholder}
        value={form.state}
        options={NIGERIAN_STATES.map((s) => ({ value: s, label: s }))}
        onChange={(v) => set('state', v)}
        closeLabel={t.common.close}
        error={error === 'errorLocation' ? f.errorLocation : undefined}
      />
      {form.state ? <TextField label={t.onboarding.lga} value={form.lga} onChangeText={(v) => set('lga', v)} maxLength={60} /> : null}

      <TextField
        label={f.size}
        placeholder={f.sizePlaceholder}
        value={form.size}
        onChangeText={(v) => set('size', v.replace(/[^0-9.,]/g, ''))}
        keyboardType="decimal-pad"
        maxLength={10}
        error={error === 'errorSize' ? f.errorSize : undefined}
      />
      <Chips
        label={f.size}
        value={form.unit}
        onChange={(v) => set('unit', v)}
        options={[
          { value: 'ha', label: f.hectares },
          { value: 'acres', label: f.acres },
        ]}
      />

      {message && error !== 'errorName' && error !== 'errorSize' && error !== 'errorLocation' ? <Notice>{message}</Notice> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: { width: 120 },
  flex: { flex: 1 },
  top: { marginTop: space[2] },
  group: { gap: space[2] },
  gpsRow: { flexDirection: 'row', gap: space[3], alignItems: 'center' },
  gpsIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.mintSoft, alignItems: 'center', justifyContent: 'center' },
});
