import { Linking } from 'react-native';
import { useI18n } from '../i18n';
import { useFlags } from '../lib/flags';
import { siteLink } from '../lib/site';
import { Card, Header, Notice, Row, Screen, Text } from '../ui';

/** Get help with a job: the job's advice, the farm assistant (on the website) and contacting the team. */
export function HelpScreen({ topic, advice, onBack }: { topic?: string; advice?: string; onBack: () => void }) {
  const { t, lang } = useI18n();
  const h = t.help;
  const flags = useFlags();
  return (
    <Screen header={<Header onBack={onBack} backLabel={t.common.back} title={h.title} />}>
      <Text muted>{h.intro}</Text>
      {topic ? (
        <Card>
          <Text variant="small" muted>{h.about}</Text>
          <Text variant="heading">{topic}</Text>
          {advice ? <Text>{advice}</Text> : null}
        </Card>
      ) : null}
      <Card>
        <Row icon="message-circle" title={h.assistant} detail={h.assistantHint} onPress={() => Linking.openURL(siteLink(lang, 'account/assistant'))} />
        <Row icon="phone" title={h.contact} detail={h.contactHint} onPress={() => Linking.openURL(siteLink(lang, 'contact'))} />
      </Card>
      {flags.ai_photo_diagnosis ? null : <Notice tone="info">{h.photoSoon}</Notice>}
    </Screen>
  );
}
