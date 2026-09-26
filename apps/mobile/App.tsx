import { brand, colors, formatNaira, ROLE_LABELS, space } from '@cultivanode/shared';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { supabase, supabaseConfigured } from './src/lib/supabase';
import { Button, Card, Text } from './src/ui';

// M0 placeholder screen built from the design system. Real screens arrive in M1.
export default function App() {
  const [status, setStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function checkConnection() {
    if (!supabaseConfigured) {
      setStatus('Supabase is not set up. Copy apps/mobile/.env.example to .env and restart.');
      return;
    }
    setChecking(true);
    const { error } = await supabase.auth.getSession();
    setChecking(false);
    setStatus(error ? `Could not reach Supabase: ${error.message}` : 'Connected to Supabase.');
  }

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <Text variant="title" color={colors.leaf[700]}>
            {brand.name}
          </Text>
          <Text muted>Your farm&apos;s working partner.</Text>
        </View>

        <Card>
          <Text variant="heading">Development build</Text>
          <Text muted>
            {Object.keys(ROLE_LABELS).length} roles loaded. Tractor hire example: {formatNaira(2_500_000)} per hectare.
          </Text>
        </Card>

        <Button title="Check connection" onPress={checkConnection} loading={checking} />
        {status ? <Text accessibilityLiveRegion="polite">{status}</Text> : null}
      </ScrollView>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space[6], gap: space[5], paddingTop: space[16] },
  brand: { gap: space[1] },
});
