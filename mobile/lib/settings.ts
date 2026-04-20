import AsyncStorage from "@react-native-async-storage/async-storage";

// App-level user preferences persisted to device storage.
// These are local-only (not synced to Supabase). For cross-device sync, move
// into a dedicated Supabase table later.

const KEY = "lawos:user_settings:v1";

export type UserSettings = {
  push: boolean;
  email: boolean;
  reminder: boolean;
  offline: boolean;
};

const DEFAULTS: UserSettings = {
  push: true,
  email: true,
  reminder: false,
  offline: true,
};

export async function loadSettings(): Promise<UserSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle keys added in later versions.
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export async function saveSettings(patch: Partial<UserSettings>): Promise<void> {
  const current = await loadSettings();
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
