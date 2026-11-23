import { addDays } from '@cultivanode/shared/crop-plan';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fill, useI18n } from '../i18n';
import { daysFromToday, whenLabel } from '../lib/dates';
import { loadCrops, loadJobs, markJobDone, moveJob, today, type Crop, type Job } from '../lib/farm';
import { useFlags } from '../lib/flags';
import { useSession } from '../lib/session';
import { color as c, space } from '../theme';
import { Button, Card, Empty, Pill, Row, Screen, SectionTitle, Text, type IconName } from '../ui';
import { cropLabel, CropCard } from './HomeScreen';

export type FarmTool = 'livestock' | 'books' | 'inventory' | 'map' | 'scouting' | 'assistant';
type Props = { onAddCrop: () => void; onAddFarm: () => void; onTool: (tool: FarmTool) => void };

/** My farm: crops, every job still to do (late, this week, later) and the farm tools that are switched on. */
export function FarmScreen({ onAddCrop, onAddFarm, onTool }: Props) {
  const { t, lang } = useI18n();
  const f = t.farm;
  const { farm } = useSession();
  const flags = useFlags();
  const [crops, setCrops] = useState<Crop[] | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!farm) return setCrops([]);
    const cr = await loadCrops(farm.id).catch(() => [] as Crop[]);
    setCrops(cr);
    setJobs(await loadJobs(farm.id, cr).catch(() => [] as Job[]));
  }, [farm]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(job: Job, kind: 'done' | 'move') {
    setBusy(`${kind}-${job.id}`);
    const ok = kind === 'done' ? await markJobDone(job.id) : await moveJob(job.id, addDays(today(), 1));
    setBusy(null);
    if (ok) await load();
  }

  const late = jobs.filter((j) => daysFromToday(j.date) < 0);
  const week = jobs.filter((j) => daysFromToday(j.date) >= 0 && daysFromToday(j.date) <= 7);
  const later = jobs.filter((j) => daysFromToday(j.date) > 7).slice(0, 10);

  const tools: { key: FarmTool; icon: IconName; on: boolean }[] = [
    { key: 'scouting', icon: 'eye', on: true },
    { key: 'assistant', icon: 'message-circle', on: true },
    { key: 'books', icon: 'book-open', on: true },
    { key: 'inventory', icon: 'package', on: true },
    { key: 'livestock', icon: 'feather', on: flags.module_livestock === true },
    { key: 'map', icon: 'map', on: flags.module_farm_map === true },
  ];

  const group = (title: string, list: Job[], tone: 'red' | 'amber' | 'grey') =>
    list.length ? (
      <View style={styles.group} key={title}>
        <Pill tone={tone}>{`${title} · ${list.length}`}</Pill>
        {list.map((j) => (
          <Card key={j.id}>
            <View style={styles.between}>
              <Text variant="small" color={c.secondary}>{cropLabel(j, lang)}</Text>
              <Text variant="caption" muted>{whenLabel(j.date, t.home)}</Text>
            </View>
            <Text variant="label">{j.name}</Text>
            <View style={styles.actions}>
              <Button title={t.home.markDone} icon="check" onPress={() => act(j, 'done')} loading={busy === `done-${j.id}`} style={styles.flex} />
              <Button title={f.tomorrow} variant="secondary" onPress={() => act(j, 'move')} loading={busy === `move-${j.id}`} style={styles.flex} />
            </View>
          </Card>
        ))}
      </View>
    ) : null;

  return (
    <Screen
      inTabs
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      refreshing={refreshing}
    >
      <Text variant="display" accessibilityRole="header">{farm?.name ?? f.title}</Text>
      {farm ? (
        <Text muted>{[farm.areaHa ? fill(f.size, { n: farm.areaHa }) : null, farm.lga, farm.state].filter(Boolean).join(' · ')}</Text>
      ) : (
        <Button title={t.home.noFarm} icon="plus" onPress={onAddFarm} />
      )}

      {farm ? (
        <>
          <SectionTitle title={f.crops} action={f.addCrop} onAction={onAddCrop} />
          {crops && crops.length === 0 ? (
            <Card>
              <Text muted>{t.home.noCropBody}</Text>
              <Button title={f.addCrop} icon="plus" onPress={onAddCrop} />
            </Card>
          ) : null}
          {(crops ?? []).map((cr) => (
            <CropCard key={cr.id} crop={cr} />
          ))}

          <SectionTitle title={f.jobs} />
          {crops && jobs.length === 0 ? <Empty icon="check-circle" title={f.noJobs} body={f.noJobsBody} /> : null}
          {group(f.late, late, 'red')}
          {group(f.thisWeek, week, 'amber')}
          {group(f.later, later, 'grey')}

          <SectionTitle title={f.tools} />
          <Card>
            {tools
              .filter((x) => x.on)
              .map((x) => (
                <Row key={x.key} icon={x.icon} title={f.toolNames[x.key]} onPress={() => onTool(x.key)} />
              ))}
          </Card>
          <Button title={f.addFarm} variant="ghost" icon="plus" onPress={onAddFarm} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: space[2] },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[2] },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: space[2], paddingTop: space[1] },
});
