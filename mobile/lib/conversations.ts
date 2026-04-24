import { supabase } from "./supabase";
import { emitConversationChanged } from "./conversationEvents";

export type Conversation = {
  id: string;
  user_id: string;
  title: string;
  mode: "normal" | "debate";
  archived_at: string | null;
  last_message_at: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
};

export type MessageCitation = {
  id: string;
  source_type: "statute" | "case";
  source_id: string;
  snippet: string;
  score: number | null;
  label: string;
  subtitle: string | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system" | "debate_agent";
  content: string;
  model: string | null;
  created_at: string;
  citations: MessageCitation[];
};

type RawCitationRow = {
  id: string;
  source_type: "statute" | "case";
  source_id: string;
  snippet: string;
  score: number | null;
};

type RawMessageRow = {
  id: string;
  conversation_id: string;
  role: Message["role"];
  content: string;
  model: string | null;
  created_at: string;
  citations: RawCitationRow[] | null;
};

// Create a new conversation owned by the current user.
// Title is a short preview of the first message; caller can update later.
export async function createConversation(params: {
  title: string;
  mode?: "normal" | "debate";
}): Promise<{ data: Conversation | null; error: Error | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return { data: null, error: new Error("no active session") };

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      title: params.title.slice(0, 80),
      mode: params.mode ?? "normal",
    })
    .select()
    .single();

  if (data && !error) {
    emitConversationChanged();
  }

  return { data: data as Conversation | null, error: error as Error | null };
}

export async function listConversations(): Promise<{
  data: Conversation[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .is("archived_at", null)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100);

  return {
    data: (data as Conversation[]) ?? [],
    error: error as Error | null,
  };
}

export async function getConversation(
  id: string,
): Promise<{ data: Conversation | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return {
    data: data as Conversation | null,
    error: error as Error | null,
  };
}

export async function deleteConversation(id: string) {
  const { error } = await supabase.from("conversations").delete().eq("id", id);
  if (!error) {
    emitConversationChanged();
  }
  return { error: error as Error | null };
}

export async function archiveConversation(
  id: string,
  archived: boolean,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("conversations")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (!error) {
    emitConversationChanged();
  }
  return { error: error as Error | null };
}

async function enrichCitations(rawMessages: RawMessageRow[]): Promise<Message[]> {
  const statuteIds = Array.from(
    new Set(
      rawMessages.flatMap((message) =>
        (message.citations ?? [])
          .filter((citation) => citation.source_type === "statute")
          .map((citation) => citation.source_id),
      ),
    ),
  );
  const caseIds = Array.from(
    new Set(
      rawMessages.flatMap((message) =>
        (message.citations ?? [])
          .filter((citation) => citation.source_type === "case")
          .map((citation) => citation.source_id),
      ),
    ),
  );

  const statuteMap = new Map<string, { label: string; subtitle: string | null }>();
  const caseMap = new Map<string, { label: string; subtitle: string | null }>();

  const [statuteRes, caseRes] = await Promise.all([
    statuteIds.length > 0
      ? supabase
          .from("statutes")
          .select("id, code_kr, article_no, title")
          .in("id", statuteIds)
      : Promise.resolve({ data: null as
          | { id: string; code_kr: string; article_no: string; title: string | null }[]
          | null }),
    caseIds.length > 0
      ? supabase
          .from("cases")
          .select("id, case_no, court, decided_at")
          .in("id", caseIds)
      : Promise.resolve({ data: null as
          | { id: string; case_no: string; court: string; decided_at: string }[]
          | null }),
  ]);

  for (const row of statuteRes.data ?? []) {
    statuteMap.set(row.id, {
      label: `${row.code_kr} ${row.article_no}`,
      subtitle: row.title,
    });
  }
  for (const row of caseRes.data ?? []) {
    caseMap.set(row.id, {
      label: row.case_no,
      subtitle: `${row.court} · ${row.decided_at}`,
    });
  }

  return rawMessages.map((message) => ({
    id: message.id,
    conversation_id: message.conversation_id,
    role: message.role,
    content: message.content,
    model: message.model,
    created_at: message.created_at,
    citations: (message.citations ?? []).map((citation) => {
      const sourceMeta =
        citation.source_type === "statute"
          ? statuteMap.get(citation.source_id)
          : caseMap.get(citation.source_id);
      return {
        id: citation.id,
        source_type: citation.source_type,
        source_id: citation.source_id,
        snippet: citation.snippet,
        score: typeof citation.score === "number" ? citation.score : null,
        label: sourceMeta?.label ?? citation.source_id,
        subtitle: sourceMeta?.subtitle ?? null,
      } satisfies MessageCitation;
    }),
  }));
}

// List messages in a conversation ordered by creation time.
export async function listMessages(
  conversationId: string,
): Promise<{ data: Message[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, conversation_id, role, content, model, created_at, citations(id, source_type, source_id, snippet, score)",
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    return {
      data: [],
      error: error as Error | null,
    };
  }

  const enriched = await enrichCitations((data as unknown as RawMessageRow[]) ?? []);
  return {
    data: enriched,
    error: null,
  };
}

// Insert a message row. Returns the stored row so callers can use the
// server-assigned id / timestamp.
export async function insertMessage(params: {
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  model?: string | null;
}): Promise<{ data: Message | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: params.conversationId,
      role: params.role,
      content: params.content,
      model: params.model ?? null,
    })
    .select()
    .single();
  return {
    data: data
      ? ({
          ...(data as Omit<Message, "citations">),
          citations: [],
        } as Message)
      : null,
    error: error as Error | null,
  };
}

// Atomically increments message_count + updates last_message_at via RPC.
// Falls back to a read-then-write path if the RPC is missing (migration not applied).
export async function touchConversation(
  conversationId: string,
  incrementBy = 1,
) {
  const rpcResult = await supabase.rpc("increment_conversation_message_count", {
    p_conversation_id: conversationId,
    p_increment: incrementBy,
  });

  if (!rpcResult.error) {
    return { error: null as Error | null };
  }

  // Fallback path: RPC not yet deployed (docs/supabase/003_atomic_counters.sql).
  const { data: current } = await supabase
    .from("conversations")
    .select("message_count")
    .eq("id", conversationId)
    .maybeSingle();

  const nextCount = (current?.message_count ?? 0) + incrementBy;
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("conversations")
    .update({
      last_message_at: now,
      message_count: nextCount,
    })
    .eq("id", conversationId);
  return { error: error as Error | null };
}
