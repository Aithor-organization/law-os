import { supabase } from "./supabase";

function getApiBaseUrl(): string {
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!apiBase) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL not set");
  }
  return apiBase.replace(/\/$/, "");
}

export type SearchCode = "civil" | "criminal" | "constitutional" | "commercial";
export type SearchTarget = "statute" | "case" | "all";

export type SearchItem = {
  id: string;
  type: "statute" | "case";
  title: string;
  textPreview: string;
  score: number;
  code: SearchCode | null;
  codeKr: string | null;
  articleNo: string | null;
  part: string | null;
  chapter: string | null;
  caseNo: string | null;
  court: string | null;
  decidedAt: string | null;
  category: string | null;
};

export type SearchResponse = {
  items: SearchItem[];
  total: number;
  query: string;
  filters: {
    code: SearchCode | null;
    article: number | null;
  };
  target: SearchTarget;
  mode: string;
};

export async function searchLawContent(params: {
  query: string;
  target?: SearchTarget;
  code?: SearchCode;
  article?: number;
  limit?: number;
}): Promise<{ data: SearchResponse | null; error: Error | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    return { data: null, error: new Error("no active session") };
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/search`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: params.query,
        target: params.target ?? "statute",
        code: params.code,
        article: params.article,
        limit: params.limit ?? 10,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: new Error(message) };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return { data: null, error: new Error(`search ${response.status}: ${text}`) };
  }

  const data = (await response.json()) as SearchResponse;
  return { data, error: null };
}

export type RecentSearch = {
  id: string;
  query: string;
  result_type: "statute" | "case" | "all";
  result_count: number;
  searched_at: string;
};

export async function listRecentSearches(limit = 10): Promise<{
  data: RecentSearch[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("search_history")
    .select("id, query, result_type, result_count, searched_at")
    .order("searched_at", { ascending: false })
    .limit(limit);

  return {
    data: (data as RecentSearch[]) ?? [],
    error: error as Error | null,
  };
}

export type TrendingSearch = {
  id: string;
  query: string;
  category: string | null;
  search_count: number;
  last_searched_at: string;
};

export async function listTrendingSearches(limit = 5): Promise<{
  data: TrendingSearch[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("search_analytics")
    .select("id, query, category, search_count, last_searched_at")
    .order("search_count", { ascending: false })
    .order("last_searched_at", { ascending: false })
    .limit(limit);

  return {
    data: (data as TrendingSearch[]) ?? [],
    error: error as Error | null,
  };
}
