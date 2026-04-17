import { supabase } from "./supabase";

export type BookmarkSourceType = "statute" | "case";

export type Bookmark = {
  id: string;
  user_id: string;
  source_type: BookmarkSourceType;
  source_id: string;
  note: string | null;
  created_at: string;
};

// Toggle a bookmark. Returns the new bookmarked state (true = now bookmarked).
// Falls back to a client-side check-then-insert path if the RPC is missing
// (005_bookmarks.sql not yet applied).
export async function toggleBookmark(params: {
  sourceType: BookmarkSourceType;
  sourceId: string;
}): Promise<{ bookmarked: boolean; error: Error | null }> {
  const rpcResult = await supabase.rpc("toggle_bookmark", {
    p_source_type: params.sourceType,
    p_source_id: params.sourceId,
  });

  if (!rpcResult.error) {
    return { bookmarked: Boolean(rpcResult.data), error: null };
  }

  // Fallback: manual toggle via direct table access (slower, not atomic).
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) {
    return { bookmarked: false, error: new Error("not_authenticated") };
  }

  const { data: existing } = await supabase
    .from("user_bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("source_type", params.sourceType)
    .eq("source_id", params.sourceId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("user_bookmarks")
      .delete()
      .eq("id", existing.id);
    return { bookmarked: false, error: error as Error | null };
  }

  const { error } = await supabase.from("user_bookmarks").insert({
    user_id: userId,
    source_type: params.sourceType,
    source_id: params.sourceId,
  });
  return { bookmarked: !error, error: error as Error | null };
}

export async function isBookmarked(params: {
  sourceType: BookmarkSourceType;
  sourceId: string;
}): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return false;

  const { data } = await supabase
    .from("user_bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("source_type", params.sourceType)
    .eq("source_id", params.sourceId)
    .maybeSingle();

  return Boolean(data?.id);
}

export async function listBookmarks(
  sourceType?: BookmarkSourceType,
): Promise<{ data: Bookmark[]; error: Error | null }> {
  let query = supabase
    .from("user_bookmarks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (sourceType) {
    query = query.eq("source_type", sourceType);
  }

  const { data, error } = await query;
  return {
    data: (data as Bookmark[]) ?? [],
    error: error as Error | null,
  };
}
