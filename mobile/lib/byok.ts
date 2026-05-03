import * as SecureStore from "expo-secure-store";
import { supabase } from "./supabase";

// BYOK (Bring Your Own Key) — user-supplied LLM API key flow.
//
// Storage strategy:
// - Key/provider/model live in Expo SecureStore (device keychain). Never sent
//   to our Supabase backend; only flows server-side as request headers.
// - profiles.has_byok is a server-side flag toggled when the user saves a key,
//   so the rate-limit modal and other UI know which mode the user is in.

export type Provider = "gemini" | "anthropic" | "openai" | "openrouter";
export type ModelGeneration = "current" | "previous";

const KEY_PROVIDER = "byok_provider";
const KEY_MODEL = "byok_model";
const KEY_API_KEY = "byok_api_key";

// Per-provider model lineup, split into current vs previous generation.
// Each generation lists 3 tiers (top / mid / lite) for parity across providers.
// Sourced from May 2026 official docs (see PHASE_PLAN.md or commit message).
//
// OpenAI note: GPT-5.5 (Apr 2026) released frontier tier only; mini/nano not
// yet announced. Keeping GPT-5.4 as the "complete current generation" so the
// user gets a real 3-tier lineup. GPT-5.5 is reachable via the OpenRouter
// provider or by typing the ID manually in the input field.
//
// Anthropic note: Haiku 4.4 ID is inferred from the version cadence; if the
// API rejects it, Test Ping will fail and the user can pick another tier.
export const DEFAULT_MODELS: Record<Provider, Record<ModelGeneration, string[]>> = {
  gemini: {
    current: ["gemini-3.1-pro", "gemini-3.1-flash", "gemini-3.1-flash-lite"],
    previous: ["gemini-3-pro", "gemini-3-flash", "gemini-3-flash-lite"],
  },
  anthropic: {
    current: ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5"],
    previous: ["claude-opus-4-6", "claude-sonnet-4-5", "claude-haiku-4-4"],
  },
  openai: {
    // OpenAI 공식 권장: frontier=5.5, mini/nano는 5.4 (5.5 mini/nano 미공개).
    // 출처: developers.openai.com/api/docs/models — "Start with gpt-5.5 for
    // complex reasoning and coding, or choose gpt-5.4-mini and gpt-5.4-nano".
    current: ["gpt-5.5", "gpt-5.4-mini", "gpt-5.4-nano"],
    previous: ["gpt-5", "gpt-5-mini", "gpt-5-nano"],
  },
  openrouter: {
    current: [],
    previous: [],
  },
};

// Convenience: flat list (current first, previous after) for places that
// don't render the generation split.
export function flattenModels(provider: Provider): string[] {
  return [...DEFAULT_MODELS[provider].current, ...DEFAULT_MODELS[provider].previous];
}

export function defaultModelOf(provider: Provider): string {
  return DEFAULT_MODELS[provider].current[0] ?? "";
}

export type StoredByok = {
  provider: Provider;
  model: string;
  apiKey: string;
};

export async function loadByok(): Promise<StoredByok | null> {
  const [provider, model, apiKey] = await Promise.all([
    SecureStore.getItemAsync(KEY_PROVIDER),
    SecureStore.getItemAsync(KEY_MODEL),
    SecureStore.getItemAsync(KEY_API_KEY),
  ]);
  if (!provider || !model || !apiKey) return null;
  return {
    provider: provider as Provider,
    model,
    apiKey,
  };
}

export async function saveByok(input: StoredByok): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEY_PROVIDER, input.provider),
    SecureStore.setItemAsync(KEY_MODEL, input.model),
    SecureStore.setItemAsync(KEY_API_KEY, input.apiKey),
  ]);
  await markServerHasByok(true);
}

export async function clearByok(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_PROVIDER),
    SecureStore.deleteItemAsync(KEY_MODEL),
    SecureStore.deleteItemAsync(KEY_API_KEY),
  ]);
  await markServerHasByok(false);
}

async function markServerHasByok(has: boolean): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return;
  await supabase.from("profiles").update({ has_byok: has }).eq("id", userId);
}

// Returns headers for /chat when BYOK is active. Empty object when off.
export async function byokHeaders(): Promise<Record<string, string>> {
  const stored = await loadByok();
  if (!stored) return {};
  return {
    "X-BYOK-Provider": stored.provider,
    "X-BYOK-Model": stored.model,
    "X-BYOK-Key": stored.apiKey,
  };
}

// Display the key with all but the first 4 chars masked.
export function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 4) return "•".repeat(key.length);
  return key.slice(0, 4) + "•".repeat(Math.max(0, key.length - 4));
}
