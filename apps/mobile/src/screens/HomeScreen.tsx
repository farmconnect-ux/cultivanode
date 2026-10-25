import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fill, useI18n } from '../i18n';
import { greeting, shortDate, whenLabel, daysFromToday } from '../lib/dates';
import { loadCrops, loadJobs, markJobDone, type Crop, type Job } from '../lib/farm';
import { isFarmer, useSession } from '../lib/session';
import { loadFarmWeather, type FarmWeather } from '../lib/weather';
import { color as c, font, radius, space, tap } from '../theme';
import { Button, Card, Icon, Notice, Pill, Progress, Screen, SectionTitle, Text, Tile, type IconName } from '../ui';

export type HomeTarget =
  | { to: 'hire'; kind: 'tractor' | 'hands' }
  | { to: 'sell' }
  | { to: 'buy' }
  | { to: 'market' }
  | { to: 'addCrop' }
  | { to: 'addFarm' }
  | { to: 'jobs' }
  | { to: 'help'; job?: Job };

type Props = { toast?: string; onGo: (target: HomeTarget) => void };

const WEATHER_ICON: Record<string, IconName> = {
  clear: 'sun',
  partly: 'cloud',
  cloudy: 'cloud',
  fog: 'cloud',
  drizzle: 'cloud-drizzle',
  rain: 'cloud-rain',
  storm: 'cloud-lightning',
  unknown: 'cloud',
};

/** Home: today's job, the weather, four big shortcuts and how each crop is coming along. */
export function HomeScreen({ toast, onGo }: Props) {
  const { t, lang, setLang } = useI18n();
  const h = t.home;
  const { account, farm, farms, setFarm } = useSession();
  const [crops, setCrops] = useState<Crop[] | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [weather, setWeather] = useState<FarmWeather | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(toast ?? null);
  const [busyJob, setBusyJob] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);

  const load = useCallback(async () => {
    if (!farm) {
      setCrops([]);
      setJobs([]);
      loadFarmWeather(account?.profile.state ?? null).then(setWeather);
      return;
    }
    const [cr, w] = await Promise.all([loadCrops(farm.id).catch(() => [] as Crop[]), loadFarmWeather(farm.state)]);
    setCrops(cr);
    setWeather(w);
    setJobs(await loadJobs(farm.id, cr).catch(() => [] as Job[]));
  }, [farm, account?.profile.state]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (toast) setMessage(toast);
  }, [toast]);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(id);
  }, [message]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function done(job: Job) {
    setBusyJob(job.id);
    const ok = await markJobDone(job.id);
    setBusyJob(null);
    if (ok) {
      setJobs((js) => js.filter((j) => j.id !== job.id));
      setMessage(h.doneToast);
    } else {
      setMessage(t.common.offline);
    }
  }

  const firstName = (account?.profile.full_name ?? '').trim().split(/\s+/)[0] ?? '';
  const farmer = isFarmer(account);
  const due = jobs.filter((j) => daysFromToday(j.date) <= 0);
  const focus = due[0] ?? null;
  const next = focus ? null : jobs[0] ?? null;

  return (
    <Screen inTabs onRefresh={refresh} refreshing={refreshing}>
      <View style={styles.top}>
        <View style={styles.flex}>
          <Text muted>{greeting(h)}</Text>
          <Text variant="display" numberOfLines={1}>{firstName || '👋'}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.common.switchLanguage}
          onPress={() => setLang(lang === 'en' ? 'yo' : 'en')}
          style={styles.lang}
        >
          <Text variant="label" color={lang === 'en' ? c.primary : c.inkSoft}>EN</Text>
          <Text color={c.outline}>|</Text>
          <Text variant="label" color={lang === 'yo' ? c.primary : c.inkSoft}>YO</Text>
        </Pressable>
      </View>

      {message ? <Notice tone={message === t.common.offline ? 'error' : 'success'}>{message}</Notice> : null}

      {farm ? (
        <Pressable accessibilityRole="button" accessibilityLabel={h.switchFarm} onPress={() => setPicker(true)} style={styles.farm}>
          <Icon name="map-pin" size={20} />
          <Text variant="label" style={styles.flex} numberOfLines={1}>
            {[farm.name, farm.lga ?? farm.state].filter(Boolean).join(' · ')}
          </Text>
          <Icon name="chevron-down" size={20} color={c.inkSoft} />
        </Pressable>
      ) : null}

      {weather ? <WeatherCard w={weather} /> : null}

      {farmer && !farm ? (
        <Card>
          <Text variant="heading">{h.noFarm}</Text>
          <Text muted>{h.noFarmBody}</Text>
          <Button title={h.noFarm} icon="plus" onPress={() => onGo({ to: 'addFarm' })} />
        </Card>
      ) : null}

      {farmer && farm ? (
        <View style={styles.group}>
          <SectionTitle title={h.todayTitle} action={jobs.length ? h.moreJobs : undefined} onAction={() => onGo({ to: 'jobs' })} />
          {crops && crops.length === 0 ? (
            <Card>
              <Text variant="heading">{h.noCrop}</Text>
              <Text muted>{h.noCropBody}</Text>
              <Button title={h.addCrop} icon="plus" onPress={() => onGo({ to: 'addCrop' })} />
            </Card>
          ) : focus ? (
            <JobCard job={focus} label={whenLabel(focus.date, h)} late={daysFromToday(focus.date) < 0} busy={busyJob === focus.id} onDone={() => done(focus)} onHelp={() => onGo({ to: 'help', job: focus })} />
          ) : crops ? (
            <Card>
              <View style={styles.rowCenter}>
                <Icon name="check-circle" size={22} />
                <Text variant="heading">{h.nothingToday}</Text>
              </View>
              {next ? <Text muted>{fill(h.nextJob, { job: next.name, when: whenLabel(next.date, h).toLowerCase() })}</Text> : null}
            </Card>
          ) : null}
        </View>
      ) : null}

      {!farmer ? (
        <Card tone="soft">
          <Text variant="heading">{h.buyerTitle}</Text>
          <Text muted>{h.buyerBody}</Text>
          <Button title={h.openMarket} icon="shopping-bag" onPress={() => onGo({ to: 'market' })} />
        </Card>
      ) : null}

      <View style={styles.group}>
        <SectionTitle title={h.quick} />
        <View style={styles.grid}>
          <Tile icon="truck" label={h.hireTractor} onPress={() => onGo({ to: 'hire', kind: 'tractor' })} />
          <Tile icon="users" label={h.hireHands} onPress={() => onGo({ to: 'hire', kind: 'hands' })} />
        </View>
        <View style={styles.grid}>
          <Tile icon="tag" tone="amber" label={h.sell} onPress={() => onGo({ to: 'sell' })} />
          <Tile icon="shopping-bag" tone="amber" label={h.buy} onPress={() => onGo({ to: 'buy' })} />
        </View>
      </View>

      {crops && crops.length > 0 ? (
        <View style={styles.group}>
          <SectionTitle title={h.crops} action={h.addCrop} onAction={() => onGo({ to: 'addCrop' })} />
          {crops.slice(0, 4).map((cr) => (
            <CropCard key={cr.id} crop={cr} />
          ))}
        </View>
      ) : null}

      <FarmPicker
        open={picker}
        onClose={() => setPicker(false)}
        farms={farms.map((f) => ({ id: f.id, label: f.name, hint: [f.lga, f.state].filter(Boolean).join(', ') }))}
        current={farm?.id ?? null}
        onPick={(id) => {
          setFarm(id);
          setPicker(false);
        }}
        onAdd={() => {
          setPicker(false);
          onGo({ to: 'addFarm' });
        }}
        title={h.switchFarm}
        addLabel={t.home.noFarm}
        closeLabel={t.common.close}
      />
    </Screen>
  );
}

/** The crop's name in the app language (Yorùbá from the catalogue when it has one). */
export const cropLabel = (x: { cropName: string; cropLocal: string | null }, lang: string) => (lang === 'yo' && x.cropLocal ? x.cropLocal : x.cropName);

function WeatherCard({ w }: { w: FarmWeather }) {
  const { t } = useI18n();
  const h = t.home;
  const rainy = w.todayRainMm >= 1 || (w.todayRainChance ?? 0) >= 50;
  const advice = w.holdSpraying ? h.holdSpray : w.dryWeek ? h.dryWeek : h.goodDay;
  return (
    <Card tone="dark" accessibilityLabel={`${fill(h.weatherAt, { town: w.town })}. ${advice}`}>
      <View style={styles.weatherTop}>
        <View style={styles.weatherTemp}>
          {w.tempC !== null ? <Text style={styles.temp} color={c.onDark}>{w.tempC}°</Text> : null}
          <Text color={c.onDarkSoft}>{fill(h.weatherAt, { town: w.town })}</Text>
        </View>
        <Icon name={WEATHER_ICON[w.kind] ?? 'cloud'} size={40} color={c.mint} />
      </View>
      <Text color="#e3f3ea">{fill(rainy ? h.rainToday : h.dryToday, { mm: w.weekRainMm })}</Text>
      <View style={[styles.advice, { backgroundColor: w.holdSpraying || w.dryWeek ? c.mint : 'rgba(108,248,187,0.18)' }]}>
        <Text variant="label" color={w.holdSpraying || w.dryWeek ? c.primary : c.mint}>{advice}</Text>
      </View>
    </Card>
  );
}

function JobCard({ job, label, late, busy, onDone, onHelp }: { job: Job; label: string; late: boolean; busy: boolean; onDone: () => void; onHelp: () => void }) {
  const { t, lang } = useI18n();
  return (
    <Card>
      <View style={styles.between}>
        <Text variant="small" color={c.secondary}>{`${cropLabel(job, lang)} · ${job.areaHa} ha`}</Text>
        <Pill tone={late ? 'red' : 'amber'}>{label}</Pill>
      </View>
      <Text variant="heading" style={styles.jobTitle}>{job.name}</Text>
      {job.notes ? <Text muted numberOfLines={3}>{job.notes}</Text> : null}
      {job.machinery ? (
        <View style={styles.rowCenter}>
          <Icon name="truck" size={16} color={c.inkSoft} />
          <Text variant="caption" muted style={styles.flex}>{job.machinery}</Text>
        </View>
      ) : null}
      <View style={styles.actions}>
        <Button title={t.home.markDone} icon="check" onPress={onDone} loading={busy} style={styles.flex} />
        <Button title={t.home.getHelp} variant="secondary" icon="help-circle" onPress={onHelp} style={styles.flex} />
      </View>
    </Card>
  );
}

export function CropCard({ crop }: { crop: Crop }) {
  const { t, lang } = useI18n();
  const h = t.home;
  const planned = crop.plantingDate > new Date().toISOString().slice(0, 10);
  return (
    <Card>
      <View style={styles.between}>
        <Text variant="label">{cropLabel(crop, lang)}</Text>
        <Text variant="caption" muted>{planned ? fill(h.plannedFor, { date: shortDate(crop.plantingDate) }) : fill(h.dayOf, { n: crop.day, total: crop.totalDays })}</Text>
      </View>
      <Progress value={planned ? 0 : crop.day / crop.totalDays} label={crop.cropName} />
      <Text variant="caption" muted>
        {[crop.stage, fill(h.harvestAround, { date: shortDate(crop.harvestDate) })].filter(Boolean).join(' · ')}
      </Text>
    </Card>
  );
}

function FarmPicker(p: {
  open: boolean;
  onClose: () => void;
  farms: { id: string; label: string; hint: string }[];
  current: string | null;
  onPick: (id: string) => void;
  onAdd: () => void;
  title: string;
  addLabel: string;
  closeLabel: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={p.open} transparent animationType="slide" onRequestClose={p.onClose}>
      <Pressable style={styles.backdrop} onPress={p.onClose} accessibilityLabel={p.closeLabel} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + space[4] }]}>
        <Text variant="heading">{p.title}</Text>
        {p.farms.map((f) => (
          <Pressable key={f.id} accessibilityRole="radio" accessibilityState={{ checked: f.id === p.current }} onPress={() => p.onPick(f.id)} style={[styles.pick, f.id === p.current && styles.pickOn]}>
            <View style={styles.flex}>
              <Text variant="label">{f.label}</Text>
              {f.hint ? <Text variant="caption" muted>{f.hint}</Text> : null}
            </View>
            {f.id === p.current ? <Icon name="check" size={20} /> : null}
          </Pressable>
        ))}
        <Button title={p.addLabel} variant="secondary" icon="plus" onPress={p.onAdd} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  lang: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: c.outline,
    backgroundColor: c.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  farm: {
    minHeight: tap,
    paddingHorizontal: space[4],
    borderRadius: radius.lg - 2,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  group: { gap: space[3] },
  grid: { flexDirection: 'row', gap: space[3] - 2 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[2] },
  jobTitle: { fontSize: 19, lineHeight: 24 },
  actions: { flexDirection: 'row', gap: space[3] - 2, paddingTop: space[1] },
  weatherTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weatherTemp: { flexDirection: 'row', alignItems: 'baseline', gap: space[3], flex: 1, flexWrap: 'wrap' },
  temp: { fontFamily: font.display, fontSize: 40, lineHeight: 44 },
  advice: { alignSelf: 'flex-start', paddingHorizontal: space[3], paddingVertical: 6, borderRadius: radius.pill },
  backdrop: { flex: 1, backgroundColor: 'rgba(11,28,48,0.35)' },
  sheet: { backgroundColor: c.page, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space[5], gap: space[3] },
  pick: { minHeight: tap + 8, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.card, paddingHorizontal: space[4], flexDirection: 'row', alignItems: 'center', gap: space[3] },
  pickOn: { borderColor: c.secondary, backgroundColor: c.mintSoft },
});
