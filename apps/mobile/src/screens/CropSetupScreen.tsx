import { addDays, cropChoices } from '@cultivanode/shared/crop-plan';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fill, useI18n } from '../i18n';
import { addCrop, today } from '../lib/farm';
import { space } from '../theme';
import { Button, Chips, Header, Notice, Screen, SelectField, Text, TextField } from '../ui';

type Props = {
  userId: string;
  farmId: string;
  farmAreaHa: number | null;
  onSaved: (message: string) => void;
  onSkip?: () => void;
  onBack?: () => void;
};

type When = 'today' | 'week' | 'two' | 'month' | 'other';

/** "Add your crop": what, when it was planted, how much land. The job plan is created from the catalogue. */
export function CropSetupScreen({ userId, farmId, farmAreaHa, onSaved, onSkip, onBack }: Props) {
  const { t, lang } = useI18n();
  const s = t.cropSetup;
  const crops = useMemo(() => cropChoices(), []);
  const name = (c: (typeof crops)[number]) => (lang === 'yo' && c.localName ? c.localName.split(' / ')[0]! : c.name.replace(/ \(.*\)$/, ''));
  const quick = crops.filter((c) => c.hasTemplate).slice(0, 6);

  const [cropId, setCropId] = useState<string | null>(null);
  const [when, setWhen] = useState<When | null>(null);
  const [otherDate, setOtherDate] = useState('');
  const [area, setArea] = useState(farmAreaHa ? String(Math.round(farmAreaHa * 100) / 100) : '');
  const [error, setError] = useState<'errorCrop' | 'errorDate' | 'errorArea' | 'errorGeneric' | 'offline' | null>(null);
  const [saving, setSaving] = useState(false);

  const plantingDate =
    when === 'today' ? today() : when === 'week' ? addDays(today(), -7) : when === 'two' ? addDays(today(), -14) : when === 'month' ? addDays(today(), -30) : when === 'other' ? otherDate.trim() : '';

  async function save() {
    if (!cropId) return setError('errorCrop');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(plantingDate) || Number.isNaN(Date.parse(plantingDate))) return setError('errorDate');
    const ha = Number(area.replace(',', '.'));
    if (!Number.isFinite(ha) || ha <= 0 || ha > 100000) return setError('errorArea');
    setSaving(true);
    const res = await addCrop({ farmId, cropId, plantingDate, areaHa: ha, userId });
    setSaving(false);
    if ('error' in res) return setError(res.error);
    const crop = crops.find((c) => c.id === cropId);
    onSaved(fill(s.saved, { n: res.jobs, crop: crop ? name(crop) : '' }));
  }

  const message = error === 'offline' ? t.common.offline : error === 'errorGeneric' ? s.errorGeneric : null;
  const picked = crops.find((c) => c.id === cropId);

  return (
    <Screen
      header={<Header onBack={onBack} backLabel={t.common.back} />}
      footer={
        <>
          <Button title={s.save} onPress={save} loading={saving} icon="check" />
          {onSkip ? <Button title={s.skip} variant="ghost" onPress={onSkip} /> : null}
        </>
      }
    >
      <Text variant="title" accessibilityRole="header">{s.title}</Text>
      <Text muted>{s.intro}</Text>

      <View style={styles.group}>
        <Text variant="heading">{s.crop}</Text>
        <Chips
          label={s.crop}
          value={cropId && quick.some((c) => c.id === cropId) ? cropId : null}
          onChange={(v) => {
            setCropId(v);
            setError(null);
          }}
          options={quick.map((c) => ({ value: c.id, label: name(c) }))}
        />
        <SelectField
          label={s.moreCrops}
          placeholder={picked && !quick.includes(picked) ? name(picked) : s.allCrops}
          value={picked && !quick.includes(picked) ? picked.id : ''}
          options={crops.map((c) => ({ value: c.id, label: name(c), hint: lang === 'yo' ? c.name : c.localName }))}
          onChange={(v) => {
            setCropId(v);
            setError(null);
          }}
          closeLabel={t.common.close}
        />
        {error === 'errorCrop' ? <Notice>{s.errorCrop}</Notice> : null}
      </View>

      <View style={styles.group}>
        <Text variant="heading">{s.planted}</Text>
        <Chips
          label={s.planted}
          value={when}
          onChange={(v) => {
            setWhen(v);
            setError(null);
          }}
          options={[
            { value: 'today', label: s.today },
            { value: 'week', label: s.lastWeek },
            { value: 'two', label: s.twoWeeks },
            { value: 'month', label: s.lastMonth },
            { value: 'other', label: s.otherDate },
          ]}
        />
        {when === 'other' ? (
          <TextField
            label={s.dateLabel}
            hint={s.dateHint}
            placeholder={today()}
            value={otherDate}
            onChangeText={(v) => {
              setOtherDate(v.replace(/[^0-9-]/g, '').slice(0, 10));
              setError(null);
            }}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
        ) : null}
        {error === 'errorDate' ? <Notice>{s.errorDate}</Notice> : null}
      </View>

      <TextField
        label={s.area}
        hint={s.areaHint}
        placeholder="1"
        value={area}
        onChangeText={(v) => {
          setArea(v.replace(/[^0-9.,]/g, ''));
          setError(null);
        }}
        keyboardType="decimal-pad"
        maxLength={10}
        error={error === 'errorArea' ? s.errorArea : undefined}
      />

      {message ? <Notice>{message}</Notice> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: space[3] },
});
