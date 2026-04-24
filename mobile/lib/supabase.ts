import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import { secureAuthStorage } from "./secureAuthStorage";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fail loudly in dev; show hint to developer.
  // In production builds this branch should never hit because EAS/expo
  // embeds env vars at build time.
  console.warn(
    "[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY not set.\n" +
      "→ Copy mobile/.env.local.example to mobile/.env.local and fill in values,\n" +
      "  then fully restart the dev server (env vars are embedded at build time)."
  );
}

export const supabase = createClient(url ?? "http://localhost", anonKey ?? "anon", {
  auth: {
    // Native: SecureStore (Keychain / EncryptedSharedPreferences) with
    // a one-time migration from AsyncStorage. Web: default localStorage.
    // Guideline 5.1.2(i) — credential-class data must live in Keychain.
    storage: Platform.OS === "web" ? undefined : secureAuthStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Native apps never use URL-based flows.
    detectSessionInUrl: Platform.OS === "web",
  },
});
