import { supabase } from "./supabase";

/**
 * Study activity tracker — records daily per-user study events that feed
 * the streak calculator (lib/stats.ts) and library dashboard.
 *
 * The `study_activities` table has a UNIQUE(user_id, activity_date)
 * constraint, so each day's row is upserted and specific counters are
 * incremented via a Supabase RPC. If the RPC is missing (migration not
 * applied), we fall back to a read-then-write path that is less atomic
 * but still functional for MVP.
 *
 * Call sites (wired in the corresponding lib files):
 *   - sendChatMessage       → questions_asked
 *   - createNote            → notes_saved
 *   - markNoteReviewed      → reviews_completed
 *
 * Failures are logged but never thrown — activity tracking must never
 * break the primary user action (asking a question, saving a note).
 */

export type ActivityField =
  | "questions_asked"
  | "notes_saved"
  | "reviews_completed";

function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function recordActivity(
  field: ActivityField,
  increment = 1,
): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return;

    const today = localDateKey();

    const rpcRes = await supabase.rpc("increment_study_activity", {
      p_user_id: userId,
      p_activity_date: today,
      p_field: field,
      p_increment: increment,
    });

    if (!rpcRes.error) return;

    const { data: existing } = await supabase
      .from("study_activities")
      .select(`id, ${field}`)
      .eq("user_id", userId)
      .eq("activity_date", today)
      .maybeSingle<{ id: string } & Record<ActivityField, number>>();

    if (existing?.id) {
      const current = (existing[field] as number) ?? 0;
      await supabase
        .from("study_activities")
        .update({ [field]: current + increment })
        .eq("id", existing.id);
      return;
    }

    await supabase.from("study_activities").insert({
      user_id: userId,
      activity_date: today,
      [field]: increment,
    });
  } catch (err) {
    if (__DEV__) {
      console.warn("[studyActivity] record failed:", err);
    }
  }
}
