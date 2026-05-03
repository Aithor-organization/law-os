// Gemini API client — thin fetch wrapper over Google AI Studio REST API.
// We don't use the npm SDK to avoid Deno compatibility friction; the REST
// surface is small enough to call directly.
//
// Docs: https://ai.google.dev/gemini-api/docs/text-generation

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export type GeminiTier = "flash" | "pro";

export function getModel(tier: GeminiTier): string {
  const flash = Deno.env.get("GEMINI_MODEL_FLASH") ?? "gemini-2.5-flash";
  const pro = Deno.env.get("GEMINI_MODEL_PRO") ?? "gemini-2.5-pro";
  return tier === "pro" ? pro : flash;
}

export function getEmbeddingModel(): string {
  return Deno.env.get("GEMINI_EMBEDDING_MODEL") ?? "gemini-embedding-001";
}

function getApiKey(): string {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY not set");
  return key;
}

export type GeminiMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};

export async function generateContent(params: {
  tier: GeminiTier;
  systemInstruction?: string;
  contents: GeminiMessage[];
}): Promise<string> {
  const model = getModel(params.tier);
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${getApiKey()}`;

  const body: Record<string, unknown> = { contents: params.contents };
  if (params.systemInstruction) {
    body.systemInstruction = { parts: [{ text: params.systemInstruction }] };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini ${model} returned ${res.status}: ${text}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error(`Gemini response missing text: ${JSON.stringify(json)}`);
  }
  return text;
}

// Streaming variant — returns an AsyncIterable of text chunks.
// Gemini uses Server-Sent Events (SSE) for streaming.
export async function* streamContent(params: {
  tier: GeminiTier;
  systemInstruction?: string;
  contents: GeminiMessage[];
}): AsyncGenerator<string> {
  const model = getModel(params.tier);
  const url = `${GEMINI_BASE}/models/${model}:streamGenerateContent?alt=sse&key=${getApiKey()}`;

  const body: Record<string, unknown> = { contents: params.contents };
  if (params.systemInstruction) {
    body.systemInstruction = { parts: [{ text: params.systemInstruction }] };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini stream ${model} returned ${res.status}: ${text}`);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    // Split on SSE event delimiter.
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const event of events) {
      const line = event.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      const payload = line.slice("data: ".length).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload);
        const chunk = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof chunk === "string" && chunk.length > 0) {
          yield chunk;
        }
      } catch {
        // Ignore malformed chunks.
      }
    }
  }
}

// Embed a single text — returns the 3072-dim vector (via Matryoshka output_dimensionality).
export async function embed(text: string, dimensions = 3072): Promise<number[]> {
  const model = getEmbeddingModel();
  const url = `${GEMINI_BASE}/models/${model}:embedContent?key=${getApiKey()}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      outputDimensionality: dimensions,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini embed ${model} returned ${res.status}: ${err}`);
  }

  const json = await res.json();
  const values = json?.embedding?.values;
  if (!Array.isArray(values)) {
    throw new Error(`Gemini embed response missing values: ${JSON.stringify(json)}`);
  }
  return values;
}
