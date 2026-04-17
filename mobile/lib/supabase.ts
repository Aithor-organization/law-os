import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

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
    // AsyncStorage for native, localStorage fallback for web.
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Native apps never use URL-based flows.
    detectSessionInUrl: Platform.OS === "web",
  },
});
