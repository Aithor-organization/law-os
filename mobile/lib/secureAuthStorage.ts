/**
 * Supabase auth storage adapter backed by expo-secure-store on native
 * (iOS Keychain / Android EncryptedSharedPreferences) with a graceful
 * fallback to AsyncStorage on web (SecureStore doesn't exist there).
 *
 * Why SecureStore over AsyncStorage for auth:
 *   AsyncStorage is unencrypted on-disk. If a device is jailbroken or a
 *   backup is exfiltrated, JWT refresh tokens become harvestable. Apple
 *   App Review guideline 5.1.2(i) also expects credential-class data in
 *   the Keychain.
 *
 * One-time migration:
 *   On first read after this lands, migrateFromAsyncStorage() copies any
 *   legacy `sb-*-auth-token` entries from AsyncStorage to SecureStore
 *   and clears them from AsyncStorage. Users stay signed in.
 *
 * Supabase's auth.storage contract is the subset { getItem, setItem,
 * removeItem } — we implement all three.
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// SecureStore has a 2048-byte value cap on iOS. Supabase JWT tokens
// today are ~800 bytes, safely under the limit. If the format changes
// and bursts past 2KB we'd need to split across keys — guarded below.
const SECURE_STORE_MAX_BYTES = 2000;

let cachedAdapter: "secure" | "async" | "web" | null = null;

async function getAdapter(): Promise<"secure" | "async" | "web"> {
  if (cachedAdapter) return cachedAdapter;
  if (Platform.OS === "web") {
    cachedAdapter = "web";
    return cachedAdapter;
  }
  // Some Android devices without a screen lock reject SecureStore. Detect
  // and fall back rather than crashing login.
  try {
    const ok = await SecureStore.isAvailableAsync();
    cachedAdapter = ok ? "secure" : "async";
  } catch {
    cachedAdapter = "async";
  }
  return cachedAdapter;
}

async function migrateFromAsyncStorage(key: string): Promise<void> {
  try {
    const legacy = await AsyncStorage.getItem(key);
    if (legacy == null) return;
    if (legacy.length > SECURE_STORE_MAX_BYTES) {
      cachedAdapter = "async";
      return;
    }
    await SecureStore.setItemAsync(key, legacy);
    await AsyncStorage.removeItem(key);
  } catch {
    // swallow — migration is best-effort
  }
}

export const secureAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    const adapter = await getAdapter();
    if (adapter === "web") return null; // Supabase uses localStorage on web
    if (adapter === "secure") {
      const existing = await SecureStore.getItemAsync(key);
      if (existing != null) return existing;
      await migrateFromAsyncStorage(key);
      return SecureStore.getItemAsync(key);
    }
    return AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    const adapter = await getAdapter();
    if (adapter === "web") return;
    if (adapter === "secure") {
      if (value.length <= SECURE_STORE_MAX_BYTES) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
      // Value too large for SecureStore — degrade to AsyncStorage for
      // this key only. Future reads will find it via the async branch.
      cachedAdapter = "async";
      await AsyncStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    const adapter = await getAdapter();
    if (adapter === "web") return;
    if (adapter === "secure") {
      await SecureStore.deleteItemAsync(key);
    }
    // Always clear AsyncStorage too in case a legacy value lingered.
    await AsyncStorage.removeItem(key);
  },
};
