import { supabase } from "./supabase";

export type UserType = "law_school" | "bar_exam" | "undergrad" | "other";

export type Profile = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  user_type: UserType | null;
  exam_target_date: string | null;
  study_goal: string | null;
  school: string | null;
  school_year: number | null;
  locale: string;
  timezone: string;
  tos_accepted_at: string | null;
  privacy_accepted_at: string | null;
  legal_disclaimer_accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function signUpWithEmail(params: {
  email: string;
  password: string;
  name: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: { name: params.name },
    },
  });
  return { data, error };
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

import { unregisterPushToken } from "./pushTokens";

export async function signOut() {
  // Best-effort unregister push token before signOut so RLS still lets
  // the delete through. After signOut auth.uid() becomes null and the
  // policy would reject the delete.
  try {
    await unregisterPushToken();
  } catch {
    // swallow — push notifications may be unavailable (simulator, denied)
  }
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Permanently deletes the current user's account and all owned rows
// (conversations/messages/notes/bookmarks/study_activities/profile) via
// an RPC that runs as SECURITY DEFINER. PIPA §21 compliance.
//
// IMPORTANT: we only clear the local session when the RPC has confirmed
// success. On failure (network, RPC error, timeout) we leave the session
// intact so the user can retry or contact support — and so support can
// see the server-side state. Clearing the session on failure would leave
// deletion in an ambiguous, unresolvable state for an irreversible op.
export async function deleteAccount(): Promise<{ error: Error | null }> {
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    return { error: error as Error };
  }
  // RPC confirmed success — now clear local session. If signOut itself
  // fails (rare — auth row already deleted), we surface that separately.
  const signOutRes = await supabase.auth.signOut();
  return { error: (signOutRes.error as Error | null) ?? null };
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

// Write consent timestamps + name to profiles row (created by DB trigger).
export async function recordConsent(name: string) {
  const now = new Date().toISOString();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return { error: new Error("no active session") };

  const { error } = await supabase
    .from("profiles")
    .update({
      name,
      tos_accepted_at: now,
      privacy_accepted_at: now,
      legal_disclaimer_accepted_at: now,
    })
    .eq("id", userId);
  return { error };
}

export async function saveOnboarding(params: {
  userType: UserType;
  studyGoal: string | null;
  subjects: string[];
}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return { error: new Error("no active session") };

  const { error } = await supabase
    .from("profiles")
    .update({
      user_type: params.userType,
      study_goal: params.studyGoal,
    })
    .eq("id", userId);
  // Subjects stored separately via user_favorites or a settings table;
  // for MVP we keep only user_type + study_goal in profiles.
  return { error };
}

// Fetch the current authenticated user's profile row.
export async function getProfile(): Promise<{
  data: Profile | null;
  error: Error | null;
}> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) {
    return { data: null, error: new Error("no active session") };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return {
    data: (data as Profile | null) ?? null,
    error: (error as Error | null) ?? null,
  };
}

// Update mutable profile fields. Does NOT change email (user flow handles that).
export async function updateProfile(params: {
  name?: string;
  school?: string | null;
  school_year?: number | null;
  study_goal?: string | null;
  exam_target_date?: string | null;
  user_type?: UserType | null;
}): Promise<{ error: Error | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return { error: new Error("no active session") };

  // Strip undefined fields so we don't overwrite with null by accident.
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) patch[key] = value;
  }
  if (Object.keys(patch).length === 0) return { error: null };

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId);
  return { error: error as Error | null };
}

// Send a password reset email via Supabase. The email contains a magic link
// that routes back to the app's reset-password screen (configured in Supabase
// Dashboard → Authentication → URL Configuration → Redirect URLs).
export async function sendPasswordReset(email: string): Promise<{
  error: Error | null;
}> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  return { error: error as Error | null };
}

// Update the current user's password (requires an active session — for the
// case when a user is logged in and wants to change password from settings).
export async function updatePassword(newPassword: string): Promise<{
  error: Error | null;
}> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error as Error | null };
}

// Soft-delete via profiles.deleted_at. Full account deletion requires admin
// API (server-side) — here we mark the profile and sign out.
export async function requestAccountDeletion(): Promise<{
  error: Error | null;
}> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return { error: new Error("no active session") };

  const { error } = await supabase
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { error: error as Error };

  await supabase.auth.signOut();
  return { error: null };
}
