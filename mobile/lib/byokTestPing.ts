import { supabase } from "./supabase";
import type { Provider } from "./byok";

// BYOK API 키 검증 — 백엔드 /byok/test 프록시 경유.
//
// Why proxy (not direct provider call):
// - Gemini REST API는 ?key=... URL 파라미터를 사용 → 클라이언트 네트워크 로그
//   /ISP 트레이스/회사 프록시에 키가 평문으로 남음.
// - 백엔드 경유 시 키가 HTTPS request body 안에서만 흐르고, BYOKConfig
//   __repr__가 자동 마스킹 → 어떤 future 로깅 경로에서도 안전.
// - 추가 이점: rate-limit/audit/abuse 감지를 백엔드에서 중앙 처리 가능.

function getBackendBaseUrl(): string {
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!apiBase) throw new Error("EXPO_PUBLIC_API_BASE_URL not set");
  return apiBase.replace(/\/$/, "");
}

export type TestResult = {
  ok: boolean;
  message: string;
};

// signal: 컴포넌트 unmount 시 useEffect cleanup에서 abort 가능. 미전달 시
// 무한 대기 방지를 위해 내부 10초 타임아웃 적용.
export async function testPing(
  provider: Provider,
  apiKey: string,
  signal?: AbortSignal,
): Promise<TestResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    return { ok: false, message: "로그인이 만료되었습니다" };
  }

  // 내부 타임아웃 (사용자 signal 우선)
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 10_000);
  const combinedSignal = signal ?? timeoutController.signal;

  try {
    const res = await fetch(`${getBackendBaseUrl()}/byok/test`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "X-BYOK-Provider": provider,
        // model은 백엔드 검증에 필요하지만 ping에는 unused — placeholder OK
        "X-BYOK-Model": "_test",
        "X-BYOK-Key": apiKey,
      },
      signal: combinedSignal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const detail = (body as { detail?: string }).detail ?? `HTTP ${res.status}`;
      return { ok: false, message: detail };
    }
    const json = (await res.json()) as { ok: boolean; provider: string };
    return json.ok
      ? { ok: true, message: `${provider} 키 유효` }
      : { ok: false, message: `${provider} 키 거절됨` };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, message: "검증 시간 초과 또는 취소됨" };
    }
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

// OpenRouter 동적 모델 목록 — 1시간 메모리 캐시.
// 모델 카탈로그는 공개 정보(키 불필요)라 클라이언트 직접 fetch 유지.
type ORModel = { id: string; name?: string };
let openRouterCache: { ts: number; models: ORModel[] } | null = null;
const ONE_HOUR_MS = 60 * 60 * 1000;

export async function fetchOpenRouterModels(
  signal?: AbortSignal,
): Promise<ORModel[]> {
  const now = Date.now();
  if (openRouterCache && now - openRouterCache.ts < ONE_HOUR_MS) {
    return openRouterCache.models;
  }
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      signal,
    });
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const json = (await res.json()) as { data?: ORModel[] };
    const models = (json.data ?? []).filter((m) => m.id);
    openRouterCache = { ts: now, models };
    return models;
  } catch {
    return [];
  }
}
