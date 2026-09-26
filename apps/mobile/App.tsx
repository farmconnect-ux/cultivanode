import { APP_NAME, formatNaira, ROLE_LABELS } from '@tillmate/shared';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase, supabaseConfigured } from './src/lib/supabase';

// M0 placeholder. Real screens and the design system arrive in M1.
export default function App() {
  const [status, setStatus] = useState<string | null>(null);

  async function checkConnection() {
    if (!supabaseConfigured) {
      setStatus('Supabase is not set up. Copy apps/mobile/.env.example to .env and restart.');
      return;
    }
    setStatus('Checking…');
    const { error } = await supabase.auth.getSession();
    setStatus(error ? `Could not reach Supabase: ${error.message}` : 'Connected to Supabase.');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{APP_NAME}</Text>
      <Text>Development build.</Text>
      <Text>Roles loaded: {Object.keys(ROLE_LABELS).length}</Text>
      <Text>Price check: {formatNaira(2_500_000)}</Text>
      <Pressable accessibilityRole="button" onPress={checkConnection} style={styles.button}>
        <Text style={styles.buttonText}>Check connection</Text>
      </Pressable>
      {status ? <Text>{status}</Text> : null}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 28, fontWeight: '600' },
  button: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#1f5130' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
