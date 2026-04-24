/**
 * Push notification token lifecycle — registers the device's Expo Push
 * Token against the current user, and cleans it up on logout / account
 * deletion.
 *
 * Dependencies (must be installed; static imports — Metro cannot resolve
 * dynamic require()):
 *   expo-notifications, expo-device, expo-application
 *
 * Runtime flow:
 *   1. ensureNotificationPermissions() — request alert/badge/sound permission
 *   2. registerPushToken()             — fetch Expo Push Token + upsert
 *   3. unregisterPushToken()           — delete row on logout (best effort)
 *
 * Failures are logged and swallowed — push registration must never block
 * the login/main flow.
 */

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as Application from "expo-application";
import { supabase } from "./supabase";

let cachedDeviceId: string | null = null;

function getPersistentDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;
  const id =
    Application.getAndroidId?.() ??
    Application.applicationId ??
    `${Platform.OS}-unknown-${Date.now()}`;
  cachedDeviceId = String(id);
  return cachedDeviceId;
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

export async function registerPushToken(): Promise<{ token?: string; error?: string }> {
  try {
    // Simulator / Emulator — Expo cannot issue push tokens. Skip silently.
    if (Device.isDevice === false) {
      return { error: "simulator" };
    }

    const permitted = await ensureNotificationPermissions();
    if (!permitted) return { error: "permission-denied" };

    // Android needs a default channel for Expo Push to render on system UI.
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const tokenResult = await Notifications.getExpoPushTokenAsync();
    const token = tokenResult.data;
    if (!token) return { error: "no-token" };

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return { error: "no-session", token };

    const { error } = await supabase.from("push_tokens").upsert(
      {
        user_id: userId,
        device_id: getPersistentDeviceId(),
        token,
        platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web",
        app_version: Application.nativeApplicationVersion ?? null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id,device_id" },
    );
    if (error) return { error: error.message, token };
    return { token };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// Best-effort: delete this device's token row on logout. Does not throw
// if the row is already gone (different session may have cleared it).
export async function unregisterPushToken(): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return;
    await supabase
      .from("push_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("device_id", getPersistentDeviceId());
  } catch {
    // swallow
  }
}
