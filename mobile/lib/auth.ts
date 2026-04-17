import { supabase } from "./supabase";

export type UserType = "law_school" | "bar_exam" | "undergrad" | "other";

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

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
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
