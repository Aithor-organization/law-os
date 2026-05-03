// POST /chat — streaming chat endpoint.
//
// Request body:
//   { message: string, tier?: "flash" | "pro", conversationId?: string }
//
// Response: Server-Sent Events (SSE) with text chunks.
//
// Minimal MVP: no RAG, no DB persistence. Those land in later phases (see
// roadmap in docs/). This endpoint just proves the pipeline Mobile → Edge
// Function → Gemini → streaming works.

import { corsHeaders } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { streamContent, type GeminiTier } from "../_shared/gemini.ts";

const SYSTEM_INSTRUCTION = `당신은 LAW.OS, 한국 법학도를 위한 AI 법률 학습 튜터입니다.

원칙:
1. 민법·형법·헌법·상법 등 대한민국 법령과 대법원 판례에 근거해 답변합니다.
2. 모든 답변에 **출처(조문 번호 또는 판례 사건번호)** 를 함께 제시합니다.
3. 당신은 학습 도구이지 법률 자문 제공자가 아닙니다. 개인의 구체적 사건에 대한
   자문·대리·승소 예측은 거부하고, "일반 법령 정보는 ~이며, 구체적인 사건은 변호사
   상담을 권합니다"라고 안내합니다. (변호사법 제109조 준수)
4. 답변은 간결하고 학술적인 한국어로 작성합니다. 과장된 어조·이모지 금지.
5. 확실하지 않은 사실은 "확인이 필요합니다"라고 표시합니다.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  try {
    await getAuthenticatedUser(req);
  } catch (errOrRes) {
    if (errOrRes instanceof Response) {
      // Propagate auth Response but add CORS headers.
      const body = await errOrRes.text();
      return new Response(body, {
        status: errOrRes.status,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
    throw errOrRes;
  }

  let payload: { message?: string; tier?: GeminiTier; conversationId?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const message = payload.message?.trim();
  if (!message) {
    return new Response(JSON.stringify({ error: "message_required" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const tier: GeminiTier = payload.tier === "pro" ? "pro" : "flash";

  // Stream Gemini response as SSE.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamContent({
          tier,
          systemInstruction: SYSTEM_INSTRUCTION,
          contents: [{ role: "user", parts: [{ text: message }] }],
        })) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`),
          );
        }
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[chat] stream failed", msg);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      "connection": "keep-alive",
    },
  });
});
