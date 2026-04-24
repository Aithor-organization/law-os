import { supabase } from "./supabase";
import { recordActivity } from "./studyActivity";

export type NoteSubject = "civil" | "criminal" | "constitutional" | "commercial" | "other";

export type Note = {
  id: string;
  user_id: string;
  message_id: string | null;
  question: string;
  answer: string;
  subject: NoteSubject;
  topic: string | null;
  tags: string[];
  review_count: number;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  starred: boolean;
  created_at: string;
  updated_at: string;
};

// Create a new note from a chat message pair (question + answer) or freeform text.
export async function createNote(params: {
  question: string;
  answer: string;
  subject: NoteSubject;
  topic?: string | null;
  tags?: string[];
  starred?: boolean;
  messageId?: string | null;
}): Promise<{ data: Note | null; error: Error | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return { data: null, error: new Error("no active session") };

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: userId,
      question: params.question.trim(),
      answer: params.answer.trim(),
      subject: params.subject,
      topic: params.topic ?? null,
      tags: params.tags ?? [],
      starred: params.starred ?? false,
      message_id: params.messageId ?? null,
    })
    .select()
    .single();

  if (data && !error) {
    void recordActivity("notes_saved");
  }

  return {
    data: (data as Note | null) ?? null,
    error: error as Error | null,
  };
}

export async function listNotes(params?: {
  subject?: NoteSubject;
  starred?: boolean;
  limit?: number;
}): Promise<{ data: Note[]; error: Error | null }> {
  let q = supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(params?.limit ?? 100);

  if (params?.subject) q = q.eq("subject", params.subject);
  if (params?.starred !== undefined) q = q.eq("starred", params.starred);

  const { data, error } = await q;
  return {
    data: (data as Note[]) ?? [],
    error: error as Error | null,
  };
}

// Count notes without fetching rows. Used by profile stats.
export async function countNotes(params?: {
  starred?: boolean;
}): Promise<{ count: number; error: Error | null }> {
  let q = supabase.from("notes").select("id", { count: "exact", head: true });
  if (params?.starred !== undefined) q = q.eq("starred", params.starred);
  const { count, error } = await q;
  return { count: count ?? 0, error: error as Error | null };
}

export async function getNote(
  id: string,
): Promise<{ data: Note | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return {
    data: (data as Note | null) ?? null,
    error: error as Error | null,
  };
}

export async function toggleNoteStar(params: {
  id: string;
  next: boolean;
}): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("notes")
    .update({ starred: params.next })
    .eq("id", params.id);
  return { error: error as Error | null };
}

export async function deleteNote(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  return { error: error as Error | null };
}

export async function markNoteReviewed(id: string): Promise<{ error: Error | null }> {
  const now = new Date().toISOString();
  // Simple SRS: next review 1 day later (MVP — real SRS algorithm later).
  const next = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: cur } = await supabase
    .from("notes")
    .select("review_count")
    .eq("id", id)
    .maybeSingle();
  const nextCount = ((cur as { review_count: number } | null)?.review_count ?? 0) + 1;

  const { error } = await supabase
    .from("notes")
    .update({
      last_reviewed_at: now,
      next_review_at: next,
      review_count: nextCount,
    })
    .eq("id", id);

  if (!error) {
    void recordActivity("reviews_completed");
  }

  return { error: error as Error | null };
}
