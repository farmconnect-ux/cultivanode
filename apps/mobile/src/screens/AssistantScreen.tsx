import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fill, useI18n } from '../i18n';
import {
  askAssistant,
  grantAiConsent,
  hasAiConsent,
  loadAssistantCycles,
  plainAnswer,
  recordAssistantFeedback,
  type AssistantCycle,
  type FeedbackOutcome,
} from '../lib/assistant';
import { useSession } from '../lib/session';
import { space } from '../theme';
import { Button, Card, Chips, Header, Notice, Pill, Screen, Text, TextField } from '../ui';

type Message =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; text: string; traceId: string | null; basic: boolean; safety: string[] };

const WHOLE_FARM = 'whole_farm';
let seq = 0;
const nextId = () => `m${++seq}`;

/** The farm assistant: the same audited endpoint as the website, with answer feedback. */
export function AssistantScreen({ onBack }: { onBack: () => void }) {
  const { t, lang } = useI18n();
  const a = t.assistant;
  const { session, farm } = useSession();
  const [cycles, setCycles] = useState<AssistantCycle[]>([]);
  const [cycleId, setCycleId] = useState<string>(WHOLE_FARM);
  const [consent, setConsent] = useState<'unknown' | 'granted' | 'missing'>('unknown');
  const [granting, setGranting] = useState(false);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!farm) return;
    loadAssistantCycles(farm.id).then(setCycles).catch(() => setCycles([]));
  }, [farm]);

  useEffect(() => {
    if (!session) return;
    hasAiConsent(session.user.id).then((ok) => setConsent(ok ? 'granted' : 'missing'));
  }, [session]);

  async function allow() {
    setGranting(true);
    const ok = await grantAiConsent();
    setGranting(false);
    if (ok) {
      setConsent('granted');
      setError(null);
    } else setError(a.errors.failed);
  }

  async function ask() {
    const text = query.trim();
    if (!text || busy || !farm || consent !== 'granted') return;
    setError(null);
    setBusy(true);
    setMessages((m) => [...m, { id: nextId(), role: 'user', text }]);
    setQuery('');
    const cycle = cycles.find((c) => c.id === cycleId) ?? null;
    const res = await askAssistant({ query: text, language: lang === 'yo' ? 'yo' : 'en', farmId: farm.id, cycle });
    setBusy(false);
    if (res.outcome === 'ok') {
      const r = res.answer;
      setMessages((m) => [...m, { id: nextId(), role: 'assistant', text: plainAnswer(r.answer), traceId: r.traceId, basic: r.usedBasicAdvice, safety: r.safetyNotes }]);
      return;
    }
    if (res.outcome === 'consent') setConsent('missing');
    setError(res.outcome === 'failed' && res.ref ? fill(a.errors.failedRef, { ref: res.ref }) : a.errors[res.outcome]);
  }

  const header = <Header onBack={onBack} backLabel={t.common.back} title={a.title} />;

  if (!farm) {
    return (
      <Screen header={header}>
        <Notice tone="warning">{a.noFarm}</Notice>
      </Screen>
    );
  }

  const canAsk = consent === 'granted' && !busy;
  return (
    <Screen
      header={header}
      footer={
        <View style={styles.composer}>
          <TextField label={a.placeholder} placeholder={a.placeholder} value={query} onChangeText={setQuery} maxLength={2000} multiline editable={canAsk} />
          <Button title={busy ? a.asking : a.ask} icon="send" onPress={ask} loading={busy} disabled={!canAsk || !query.trim()} />
        </View>
      }
    >
      <Text muted>{a.intro}</Text>

      {consent === 'missing' ? (
        <Card tone="soft">
          <Text variant="heading">{a.consentTitle}</Text>
          <Text muted>{a.consentBody}</Text>
          <Button title={a.allow} icon="check" onPress={allow} loading={granting} />
        </Card>
      ) : null}

      {cycles.length ? (
        <>
          <Text variant="heading">{a.crop}</Text>
          <Chips
            label={a.crop}
            value={cycleId}
            onChange={setCycleId}
            options={[
              { value: WHOLE_FARM, label: a.wholeFarm },
              ...cycles.map((c) => ({ value: c.id, label: lang === 'yo' && c.cropLocal ? c.cropLocal : c.cropName })),
            ]}
          />
        </>
      ) : null}

      {messages.map((m) =>
        m.role === 'user' ? (
          <Card key={m.id}>
            <Text variant="small" muted>{a.you}</Text>
            <Text>{m.text}</Text>
          </Card>
        ) : (
          <Card key={m.id} tone="soft">
            <View style={styles.row}>
              <Text variant="small" muted style={styles.flex}>{a.advisor}</Text>
              {m.basic ? <Pill tone="amber">{a.basicAdvice}</Pill> : null}
            </View>
            <Text>{m.text}</Text>
            {m.safety.map((x) => (
              <Notice key={x} tone="warning">{x}</Notice>
            ))}
            {m.traceId ? <Text variant="caption" muted>{fill(a.ref, { ref: m.traceId.slice(0, 8) })}</Text> : null}
            {m.traceId ? <Feedback traceId={m.traceId} /> : null}
          </Card>
        ),
      )}

      {error ? <Notice>{error}</Notice> : null}
    </Screen>
  );
}

function Feedback({ traceId }: { traceId: string }) {
  const { t } = useI18n();
  const a = t.assistant;
  const [choice, setChoice] = useState<FeedbackOutcome | null>(null);
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'note' | 'saving' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(outcome: FeedbackOutcome, withNote?: string) {
    setChoice(outcome);
    setState('saving');
    const res = await recordAssistantFeedback(traceId, outcome, withNote);
    if (res === 'failed') {
      setMessage(a.feedbackFailed);
      return setState('error');
    }
    setMessage(res === 'already' ? a.already : a.thanks);
    setState('done');
  }

  if (state === 'done') return <Text variant="caption" muted>{message}</Text>;

  const showNote = choice === 'rejected' || choice === 'modified';
  return (
    <View style={styles.feedback}>
      <Text variant="small" muted>{a.helpful}</Text>
      <View style={styles.row}>
        <Button title={a.yes} icon="thumbs-up" variant="secondary" compact onPress={() => submit('accepted')} disabled={state === 'saving'} />
        <Button title={a.no} icon="thumbs-down" variant="secondary" compact onPress={() => { setChoice('rejected'); setState('note'); }} disabled={state === 'saving'} />
        <Button title={a.changed} icon="edit-2" variant="secondary" compact onPress={() => { setChoice('modified'); setState('note'); }} disabled={state === 'saving'} />
      </View>
      {showNote ? (
        <>
          <TextField
            label={choice === 'modified' ? a.notePlaceholderChanged : a.notePlaceholderNo}
            placeholder={choice === 'modified' ? a.notePlaceholderChanged : a.notePlaceholderNo}
            value={note}
            onChangeText={setNote}
            maxLength={1000}
          />
          <Button title={a.send} compact onPress={() => choice && submit(choice, note)} loading={state === 'saving'} />
        </>
      ) : null}
      {state === 'error' ? <Notice>{message}</Notice> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space[2] },
  feedback: { gap: space[2], paddingTop: space[1] },
  composer: { gap: space[2] },
});
