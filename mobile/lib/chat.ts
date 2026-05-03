import { supabase } from "./supabase";
import { byokHeaders } from "./byok";
import { insertMessage, touchConversation } from "./conversations";
import { recordActivity } from "./studyActivity";

// 429 응답 시 RateLimitModal이 호출자에게 의미를 전달할 수 있도록 별도 에러
// 클래스로 노출. message에 used/limit/bonus 정보가 들어감.
export class FreeQuotaExhaustedError extends Error {
  constructor(
    public used: number,
    public limit: number,
    public bonus: number,
  ) {
    super("free_quota_exhausted");
    this.name = "FreeQuotaExhaustedError";
  }
}

// Chat backend URL.
// FastAPI backend is now the primary and required chat path.
function getChatBaseUrl(): string {
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!apiBase) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL not set");
  }

  return apiBase.replace(/\/$/, "");
}

export type ChatTier = "flash" | "pro";

export type LawRecommendation = {
  code: string;
  koreanName: string;
  reason: string;
  matchedArticle: string;
  score: number;
};

export type StreamHandlers = {
  onChunk: (text: string) => void;
  onError?: (error: string) => void;
  onRecommendations?: (recs: LawRecommendation[]) => void;
};

function isAbortError(err: unknown): boolean {
  return (
    err instanceof DOMException && err.name === "AbortError"
  ) || (err instanceof Error && err.name === "AbortError");
}

// Stream a chat completion from the /chat backend endpoint.
// Persists both the user message (before streaming) and the assistant message
// (after streaming completes) to Supabase.
//
// Pass an AbortSignal to cancel the in-flight request when the user navigates
// away or sends a new message while streaming.
export async function sendChatMessage(params: {
  conversationId: string;
  message: string;
  tier?: ChatTier;
  handlers: StreamHandlers;
  signal?: AbortSignal;
}): Promise<{ assistantContent: string; error: Error | null; aborted: boolean }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    return { assistantContent: "", error: new Error("no active session"), aborted: false };
  }

  // 1) Persist the user message first so UI / later reloads see it even if
  //    streaming fails partway.
  const userInsert = await insertMessage({
    conversationId: params.conversationId,
    role: "user",
    content: params.message,
  });
  if (userInsert.error) {
    return { assistantContent: "", error: userInsert.error, aborted: false };
  }

  // 2) Call the backend and stream SSE.
  const url = `${getChatBaseUrl()}/chat`;
  const extraHeaders = await byokHeaders();
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        ...extraHeaders,
      },
      body: JSON.stringify({
        message: params.message,
        tier: params.tier ?? "flash",
        conversationId: params.conversationId,
      }),
      signal: params.signal,
    });
  } catch (err) {
    if (isAbortError(err)) {
      return { assistantContent: "", error: null, aborted: true };
    }
    const msg = err instanceof Error ? err.message : String(err);
    params.handlers.onError?.(msg);
    return { assistantContent: "", error: new Error(msg), aborted: false };
  }

  // 429: free quota exhausted (BYOK off). 호출자가 RateLimitModal을 띄울
  // 수 있도록 구조화된 에러로 변환.
  if (res.status === 429) {
    const body = (await res.json().catch(() => ({}))) as {
      detail?: { used?: number; limit?: number; bonus?: number };
    };
    const d = body.detail ?? {};
    const err = new FreeQuotaExhaustedError(
      d.used ?? 0,
      d.limit ?? 5,
      d.bonus ?? 0,
    );
    params.handlers.onError?.(err.message);
    return { assistantContent: "", error: err, aborted: false };
  }

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    const msg = `chat ${res.status}: ${text}`;
    params.handlers.onError?.(msg);
    return { assistantContent: "", error: new Error(msg), aborted: false };
  }

  // 3) Parse SSE stream. Each event: `data: {"text":"..."}\n\n`
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let assistantContent = "";
  let streamError: Error | null = null;
  let aborted = false;

  const onAbort = () => {
    aborted = true;
    reader.cancel().catch(() => {
      // Ignore cancellation errors.
    });
  };
  if (params.signal) {
    if (params.signal.aborted) {
      onAbort();
    } else {
      params.signal.addEventListener("abort", onAbort, { once: true });
    }
  }

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;

      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const event of events) {
        const dataLine = event.split("\n").find((l) => l.startsWith("data: "));
        if (!dataLine) continue;
        const payload = dataLine.slice("data: ".length).trim();
        if (payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          if (typeof json.text === "string") {
            assistantContent += json.text;
            params.handlers.onChunk(json.text);
          } else if (Array.isArray(json.recommendations)) {
            params.handlers.onRecommendations?.(json.recommendations as LawRecommendation[]);
          } else if (typeof json.error === "string") {
            streamError = new Error(json.error);
            params.handlers.onError?.(json.error);
          }
        } catch {
          // ignore malformed event
        }
      }
    }
  } catch (err) {
    if (isAbortError(err) || aborted) {
      aborted = true;
    } else {
      const msg = err instanceof Error ? err.message : String(err);
      params.handlers.onError?.(msg);
      streamError = streamError ?? new Error(msg);
    }
  } finally {
    if (params.signal) {
      params.signal.removeEventListener("abort", onAbort);
    }
  }

  // 4) The backend persists assistant message + citations on successful completion.
  //    Only refresh conversation metadata if we actually received a full response.
  if (!aborted && assistantContent.length > 0) {
    await touchConversation(params.conversationId, 2);
    void recordActivity("questions_asked");
  }

  return { assistantContent, error: streamError, aborted };
}
