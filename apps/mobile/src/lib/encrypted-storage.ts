// Encrypted key-value storage for the Supabase session on the phone.
//
// The session (access and refresh tokens) is too large for the phone's secure keystore on Android,
// so we follow Supabase's recommended pattern: every write gets a fresh random 256-bit AES key,
// the key goes into the secure keystore (Android Keystore / iOS Keychain via expo-secure-store),
// and the encrypted session goes into ordinary app storage (AsyncStorage). Reading app storage alone
// (backup, rooted phone, file copy) reveals nothing without the key held by the keystore.
//
// This module has no React Native imports so it can be unit-tested in Node; secure-session.ts wires
// in the real keystore, storage and random bytes.
import aesjs from 'aes-js';

export type KeyStore = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};

export type DataStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export type EncryptedStorageDeps = {
  keyStore: KeyStore;
  dataStore: DataStore;
  randomBytes: (length: number) => Uint8Array;
};

const FORMAT = 'v1';
// Prefixed to the plaintext so a wrong key (CTR mode never "fails") is detected instead of returning noise.
const MARKER = 'cn1|';

/** expo-secure-store keys may only contain letters, digits, '.', '-' and '_'. */
export function keystoreName(key: string): string {
  return `cn.key.${key.replace(/[^A-Za-z0-9._-]/g, '_')}`;
}

export function encrypt(plain: string, key: Uint8Array, iv: Uint8Array): string {
  const ctr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(iv));
  const cipher = ctr.encrypt(aesjs.utils.utf8.toBytes(MARKER + plain));
  return `${FORMAT}:${aesjs.utils.hex.fromBytes(iv)}:${aesjs.utils.hex.fromBytes(cipher)}`;
}

/** Returns null for anything that is not a well-formed v1 value. */
export function decrypt(stored: string, key: Uint8Array): string | null {
  const [format, ivHex, cipherHex] = stored.split(':');
  if (format !== FORMAT || !ivHex || cipherHex === undefined || ivHex.length !== 32) return null;
  try {
    const ctr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(aesjs.utils.hex.toBytes(ivHex)));
    const plain = aesjs.utils.utf8.fromBytes(ctr.decrypt(aesjs.utils.hex.toBytes(cipherHex)));
    return plain.startsWith(MARKER) ? plain.slice(MARKER.length) : null;
  } catch {
    return null;
  }
}

/** A storage adapter with the shape supabase-js expects (getItem / setItem / removeItem). */
export function createEncryptedStorage({ keyStore, dataStore, randomBytes }: EncryptedStorageDeps) {
  async function removeItem(key: string): Promise<void> {
    await Promise.all([dataStore.removeItem(key), keyStore.remove(keystoreName(key))]);
  }

  return {
    async getItem(key: string): Promise<string | null> {
      const [stored, keyHex] = await Promise.all([dataStore.getItem(key), keyStore.get(keystoreName(key))]);
      if (!stored || !keyHex || keyHex.length !== 64) return null;
      const plain = decrypt(stored, aesjs.utils.hex.toBytes(keyHex));
      if (plain === null) {
        // Damaged or tampered: forget it, which simply signs the person out.
        await removeItem(key);
        return null;
      }
      return plain;
    },

    async setItem(key: string, value: string): Promise<void> {
      const aesKey = randomBytes(32);
      const iv = randomBytes(16);
      const stored = encrypt(value, aesKey, iv);
      // Key first: if the app dies between the two writes, the old ciphertext no longer matches the key,
      // the marker check fails and the person is simply signed out.
      await keyStore.set(keystoreName(key), aesjs.utils.hex.fromBytes(aesKey));
      await dataStore.setItem(key, stored);
    },

    removeItem,
  };
}
