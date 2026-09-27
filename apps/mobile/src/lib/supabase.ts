import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@cultivanode/shared';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import { createEncryptedStorage } from './encrypted-storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(url && key);

// The session is stored encrypted: AES key in the phone's keystore, ciphertext in app storage.
// See encrypted-storage.ts. Keys are readable only while the phone is unlocked, and never leave the device.
export const SESSION_KEY = 'cn-auth';
export const sessionStorage = createEncryptedStorage({
  keyStore: {
    get: (k) => SecureStore.getItemAsync(k),
    set: (k, v) => SecureStore.setItemAsync(k, v, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
    remove: (k) => SecureStore.deleteItemAsync(k),
  },
  dataStore: AsyncStorage,
  randomBytes: (n) => Crypto.getRandomBytes(n),
});

export const supabase = createClient<Database>(url ?? 'http://localhost', key ?? 'missing-key', {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: sessionStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    storageKey: SESSION_KEY,
    detectSessionInUrl: false,
  },
});

// Refresh the session only while the app is in the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
