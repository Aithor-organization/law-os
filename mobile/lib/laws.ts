import { supabase } from "./supabase";

function getApiBaseUrl(): string {
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!apiBase) throw new Error("EXPO_PUBLIC_API_BASE_URL not set");
  return apiBase.replace(/\/$/, "");
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("not authenticated");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export type CatalogItem = {
  code: string;
  korean_name: string;
  api_title: string;
  category: string;
  description: string | null;
  is_default: boolean;
  loaded: boolean;
  article_count: number | null;
};

export type MySubscription = {
  code: string;
  subscribed_at: string;
  law_catalog: {
    korean_name: string;
    category: string;
    description: string | null;
    loaded: boolean;
    article_count: number | null;
  };
};

export async function listCatalog(params?: {
  category?: string;
  search?: string;
  limit?: number;
}): Promise<CatalogItem[]> {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.search) qs.set("search", params.search);
  if (params?.limit) qs.set("limit", String(params.limit));

  const headers = await authHeader();
  const res = await fetch(`${getApiBaseUrl()}/laws/catalog?${qs}`, { headers });
  if (!res.ok) throw new Error(`catalog fetch failed: ${res.status}`);
  const body = await res.json();
  return body.items as CatalogItem[];
}

export async function listMySubscriptions(): Promise<MySubscription[]> {
  const headers = await authHeader();
  const res = await fetch(`${getApiBaseUrl()}/laws/my`, { headers });
  if (!res.ok) throw new Error(`my subs fetch failed: ${res.status}`);
  const body = await res.json();
  return body.items as MySubscription[];
}

export async function subscribeLaw(code: string): Promise<{
  code: string;
  status: "pending_ingestion" | "ready";
  ingesting: boolean;
}> {
  const headers = await authHeader();
  const res = await fetch(`${getApiBaseUrl()}/laws/subscribe`, {
    method: "POST",
    headers,
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error(`subscribe failed: ${res.status}`);
  return (await res.json()) as {
    code: string;
    status: "pending_ingestion" | "ready";
    ingesting: boolean;
  };
}

export async function unsubscribeLaw(code: string): Promise<void> {
  const headers = await authHeader();
  const res = await fetch(`${getApiBaseUrl()}/laws/subscribe/${code}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error(`unsubscribe failed: ${res.status}`);
}

export async function getInstallStatus(code: string): Promise<{
  code: string;
  loaded: boolean;
  article_count: number | null;
  status: "ready" | "pending" | "not_in_catalog";
}> {
  const headers = await authHeader();
  const res = await fetch(`${getApiBaseUrl()}/laws/install-status/${code}`, { headers });
  if (!res.ok) throw new Error(`status fetch failed: ${res.status}`);
  return res.json();
}
