import { Linking } from 'react-native';
import { useI18n } from '../i18n';
import { siteLink } from '../lib/site';
import { Card, Header, Row, Screen, Text } from '../ui';

/** Get help with a job: the job's advice, the farm assistant and contacting the team. */
export function HelpScreen({ topic, advice, onBack, onScout, onAssistant }: { topic?: string; advice?: string; onBack: () => void; onScout: () => void; onAssistant: () => void }) {
  const { t, lang } = useI18n();
  const h = t.help;
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
        <Row icon="camera" title={t.scout.title} detail={t.scout.intro} onPress={onScout} />
        <Row icon="message-circle" title={h.assistant} detail={h.assistantHint} onPress={onAssistant} />
        <Row icon="phone" title={h.contact} detail={h.contactHint} onPress={() => Linking.openURL(siteLink(lang, 'contact'))} />
      </Card>
    </Screen>
  );
}
