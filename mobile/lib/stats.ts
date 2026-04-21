import { supabase } from "./supabase";

/**
 * Streak calculation — current consecutive-days count and all-time best.
 *
 * Source: `study_activities` table (schema in 001_initial_schema.sql).
 * Each row represents a (user_id, activity_date) pair with per-day stats.
 * A "streak" is a run of consecutive activity_date values ending today
 * or yesterday (grace period — otherwise timezone quirks break streaks).
 *
 * We fetch the last 400 days (>1 year to cover best-streak leaps) and
 * compute locally. With max 365 rows per user per year this stays well
 * under any payload concerns.
 *
 * Returns { current, best } — both 0 when the user has no rows yet.
 * Callers should treat any error as current=0/best=0 (non-fatal).
 */

export interface StreakResult {
  current: number;
  best: number;
}

function toDateKey(d: Date): string {
  // YYYY-MM-DD in local time. Matches how activity_date is stored
  // (SQL DATE has no tz, so the client's perceived "today" is what counts).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(aKey: string, bKey: string): number {
  const a = new Date(aKey + "T00:00:00");
  const b = new Date(bKey + "T00:00:00");
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export async function getStreak(): Promise<StreakResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return { current: 0, best: 0 };

  const sinceKey = toDateKey(new Date(Date.now() - 400 * 86_400_000));
  const { data, error } = await supabase
    .from("study_activities")
    .select("activity_date")
    .eq("user_id", userId)
    .gte("activity_date", sinceKey)
    .order("activity_date", { ascending: false });

  if (error || !data || data.length === 0) return { current: 0, best: 0 };

  // Normalize to unique sorted-desc date keys.
  const dates: string[] = Array.from(
    new Set(data.map((r: { activity_date: string }) => r.activity_date)),
  ).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

  const todayKey = toDateKey(new Date());
  const yesterdayKey = toDateKey(new Date(Date.now() - 86_400_000));

  // Current streak: count consecutive days starting from today or yesterday.
  let current = 0;
  if (dates[0] === todayKey || dates[0] === yesterdayKey) {
    current = 1;
    for (let i = 1; i < dates.length; i++) {
      if (daysBetween(dates[i - 1], dates[i]) === 1) current++;
      else break;
    }
  }

  // Best streak: scan for the longest consecutive run across all dates.
  let best = dates.length > 0 ? 1 : 0;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (daysBetween(dates[i - 1], dates[i]) === 1) {
      run++;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }

  return { current, best };
}
