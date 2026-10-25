import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { fill, useI18n } from '../i18n';
import { loadCrops, type Crop } from '../lib/farm';
import { analyse, CATEGORIES, saveObservation, SEVERITIES, type Diagnosis } from '../lib/scout';
import { useSession } from '../lib/session';
import { color as c, radius, space } from '../theme';
import { Button, Card, Chips, Header, Icon, Notice, Pill, Screen, Text, TextField } from '../ui';
import { cropLabel } from './HomeScreen';

type Props = { onBack: () => void; initialCropId?: string };

/** Check the crop: photos and what you see; saved to the farm's scouting log and analysed by the AI. */
export function ScoutScreen({ onBack, initialCropId }: Props) {
  const { t, lang } = useI18n();
  const s = t.scout;
  const { session, farm } = useSession();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [cropId, setCropId] = useState<string | null>(initialCropId ?? null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('pest');
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]>('medium');
  const [title, setTitle] = useState('');
  const [what, setWhat] = useState('');
  const [stage, setStage] = useState<'form' | 'saving' | 'analysing' | 'done'>('form');
  const [error, setError] = useState<keyof typeof s.errors | null>(null);
  const [result, setResult] = useState<{ diagnosis?: Diagnosis; message?: string } | null>(null);

  useEffect(() => {
    if (!farm) return;
    loadCrops(farm.id)
      .then((cr) => {
        setCrops(cr);
        setCropId((x) => x ?? cr[0]?.id ?? null);
      })
      .catch(() => undefined);
  }, [farm]);

  async function addPhoto(camera: boolean) {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, allowsMultipleSelection: !camera, selectionLimit: 4 - photos.length };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets.map((a) => a.uri)].slice(0, 4));
  }

  async function save() {
    if (!cropId) return setError('crop');
    if (title.trim().length < 3) return setError('title');
    if (what.trim().length < 3) return setError('what');
    if (!session) return;
    setError(null);
    setStage('saving');
    const saved = await saveObservation(session.user.id, { cycleId: cropId, category, severity, title: title.trim(), description: what.trim(), photos, lang: lang === 'yo' ? 'yo' : 'en' });
    if ('queued' in saved) {
      setResult({ message: s.queued });
      return setStage('done');
    }
    if ('error' in saved) {
      setStage('form');
      return setError(saved.error);
    }
    if (!saved.photos) {
      setResult({ message: s.outcomes.no_photos });
      return setStage('done');
    }
    setStage('analysing');
    const res = await analyse(saved.id, lang === 'yo' ? 'yo' : 'en');
    setResult(res.outcome === 'done' ? { diagnosis: res.diagnosis } : { message: s.outcomes[res.outcome] });
    setStage('done');
  }

  function reset() {
    setPhotos([]);
    setTitle('');
    setWhat('');
    setResult(null);
    setStage('form');
  }

  const header = <Header onBack={onBack} backLabel={t.common.back} title={s.title} />;

  if (stage === 'done' && result) {
    return (
      <Screen header={header} footer={<Button title={s.another} variant="secondary" icon="plus" onPress={reset} />}>
        {result.message === s.queued ? null : <Notice tone="success">{s.saved}</Notice>}
        {photos.length ? <PhotoRow photos={photos} /> : null}
        {result.diagnosis ? <DiagnosisCard d={result.diagnosis} /> : <Notice tone="info">{result.message ?? ''}</Notice>}
      </Screen>
    );
  }

  const busy = stage === 'saving' || stage === 'analysing';
  return (
    <Screen header={header} footer={<Button title={busy ? (stage === 'analysing' ? s.analysing : s.saving) : photos.length ? s.save : s.saveOnly} icon="check" onPress={save} loading={busy} />}>
      <Text muted>{s.intro}</Text>
      {busy && stage === 'analysing' ? <Notice tone="info">{s.analysing}</Notice> : null}

      <Text variant="heading">{s.crop}</Text>
      {crops.length ? (
        <Chips label={s.crop} value={cropId} onChange={setCropId} options={crops.map((cr) => ({ value: cr.id, label: cropLabel(cr, lang) }))} />
      ) : (
        <Notice tone="warning">{s.noCrop}</Notice>
      )}

      <Text variant="heading">{s.photos}</Text>
      {photos.length ? <PhotoRow photos={photos} onRemove={(u) => setPhotos((p) => p.filter((x) => x !== u))} /> : null}
      {photos.length < 4 ? (
        <View style={styles.photoBtns}>
          <Button title={s.camera} icon="camera" onPress={() => addPhoto(true)} style={styles.flex} />
          <Button title={s.gallery} icon="image" variant="secondary" onPress={() => addPhoto(false)} style={styles.flex} />
        </View>
      ) : null}
      <Text variant="caption" muted>{s.photoHint}</Text>

      <Text variant="heading">{s.category}</Text>
      <Chips label={s.category} value={category} onChange={setCategory} options={CATEGORIES.map((k) => ({ value: k, label: s.categories[k] }))} />
      <Text variant="heading">{s.severity}</Text>
      <Chips label={s.severity} value={severity} onChange={setSeverity} options={SEVERITIES.map((k) => ({ value: k, label: s.severities[k] }))} />
      <TextField label={s.titleLabel} placeholder={s.titlePlaceholder} value={title} onChangeText={setTitle} maxLength={140} error={error === 'title' ? s.errors.title : undefined} />
      <TextField label={s.what} placeholder={s.whatPlaceholder} value={what} onChangeText={setWhat} maxLength={2000} multiline error={error === 'what' ? s.errors.what : undefined} />
      {error && error !== 'title' && error !== 'what' ? <Notice>{s.errors[error]}</Notice> : null}
    </Screen>
  );
}

function PhotoRow({ photos, onRemove }: { photos: string[]; onRemove?: (uri: string) => void }) {
  const { t } = useI18n();
  return (
    <View style={styles.photos}>
      {photos.map((u) => (
        <View key={u}>
          <Image source={{ uri: u }} style={styles.photo} accessibilityIgnoresInvertColors />
          {onRemove ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t.common.close} onPress={() => onRemove(u)} style={styles.remove} hitSlop={8}>
              <Icon name="x" size={14} color={c.onDark} />
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function DiagnosisCard({ d }: { d: Diagnosis }) {
  const { t } = useI18n();
  const s = t.scout;
  return (
    <Card tone="soft">
      <View style={styles.row}>
        <Icon name="zap" size={20} />
        <Text variant="heading" style={styles.flex}>{s.ai}</Text>
        {d.urgent ? <Pill tone="red" icon="alert-triangle">{s.urgent}</Pill> : null}
      </View>
      {d.summary ? <Text>{d.summary}</Text> : null}
      {d.likely.map((l) => (
        <View key={l.name} style={styles.likely}>
          <View style={styles.row}>
            <Text variant="label" style={styles.flex}>{l.name}</Text>
            <Pill tone={l.confidence === 'high' ? 'red' : l.confidence === 'medium' ? 'amber' : 'grey'}>{s.confidence[l.confidence]}</Pill>
          </View>
          {l.why ? <Text variant="caption" muted>{l.why}</Text> : null}
        </View>
      ))}
      {d.checks.length ? <Bullets title={s.checks} items={d.checks} /> : null}
      {d.actions.length ? <Bullets title={s.actions} items={d.actions} /> : null}
      {d.safety.map((x) => (
        <Notice key={x} tone="warning">{x}</Notice>
      ))}
      {d.see_expert_if ? <Text variant="caption" muted>{fill(s.expert, { when: d.see_expert_if })}</Text> : null}
      <Text variant="caption" muted>{s.disclaimer}</Text>
    </Card>
  );
}

function Bullets({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.bullets}>
      <Text variant="small" muted>{title}</Text>
      {items.map((i) => (
        <Text key={i}>{`• ${i}`}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  photoBtns: { flexDirection: 'row', gap: space[3] },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  photo: { width: 76, height: 76, borderRadius: radius.md, backgroundColor: c.track },
  remove: { position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  likely: { gap: 2, paddingVertical: space[1] },
  bullets: { gap: 4 },
});
