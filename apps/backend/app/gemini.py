from __future__ import annotations

import json
from typing import Sequence

import httpx

from .config import get_settings
from .http_client import get_client

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"
BASE_SYSTEM_INSTRUCTION = """당신은 LAW.OS, 한국 법학도를 위한 AI 법률 학습 튜터입니다.

원칙:
1. 민법·형법·헌법·상법 등 대한민국 법령과 대법원 판례에 근거해 답변합니다.
2. 모든 답변에 **출처(조문 번호 또는 판례 사건번호)** 를 함께 제시합니다.
3. 당신은 학습 도구이지 법률 자문 제공자가 아닙니다. 개인의 구체적 사건에 대한
   자문·대리·승소 예측은 거부하고, \"일반 법령 정보는 ~이며, 구체적인 사건은 변호사
   상담을 권합니다\"라고 안내합니다. (변호사법 제109조 준수)
4. 답변은 간결하고 학술적인 한국어로 작성합니다. 과장된 어조·이모지 금지.
5. 확실하지 않은 사실은 \"확인이 필요합니다\"라고 표시합니다."""


def _model_for_tier(tier: str) -> str:
    settings = get_settings()
    return settings.gemini_model_pro if tier == "pro" else settings.gemini_model_flash


def _auth_headers() -> dict[str, str]:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY not set")
    return {
        "content-type": "application/json",
        "x-goog-api-key": settings.gemini_api_key,
    }


def build_system_instruction(context_blocks: Sequence[str] | None = None) -> str:
    if not context_blocks:
        return BASE_SYSTEM_INSTRUCTION

    joined = "\n\n".join(context_blocks)
    return (
        f"{BASE_SYSTEM_INSTRUCTION}\n\n"
        "아래 컨텍스트를 우선 근거로 사용하세요. 컨텍스트에 없는 내용은 추측하지 말고 확인이 필요하다고 답하세요.\n\n"
        f"== 컨텍스트 ==\n{joined}"
    )


async def embed_text(text: str, *, max_retries: int = 4) -> list[float]:
    """Embed text via Gemini. Retries on 429/5xx with exponential backoff.
    Raises RuntimeError if all retries fail or the response is malformed."""
    import asyncio as _asyncio

    settings = get_settings()
    url = f"{GEMINI_BASE}/models/{settings.gemini_embedding_model}:embedContent"
    payload = {
        "content": {"parts": [{"text": text}]},
        "outputDimensionality": 3072,
    }

    client = get_client()
    last_error: str = ""
    for attempt in range(max_retries + 1):
        response = await client.post(
            url,
            headers=_auth_headers(),
            json=payload,
            timeout=30.0,
        )
        if response.status_code < 400:
            values = response.json().get("embedding", {}).get("values")
            if not isinstance(values, list):
                raise RuntimeError("Gemini embed response missing values")
            return values

        # Retry on 429 (rate limit) and 5xx (transient server error).
        if response.status_code in {429, 500, 502, 503, 504} and attempt < max_retries:
            delay = min(2 ** attempt, 30)
            await _asyncio.sleep(delay)
            last_error = f"{response.status_code}: {response.text[:200]}"
            continue

        raise RuntimeError(
            f"Gemini embed returned {response.status_code}: {response.text[:500]}"
        )

    raise RuntimeError(f"Gemini embed exhausted retries; last error: {last_error}")


async def stream_chat(
    message: str,
    tier: str = "flash",
    context_blocks: Sequence[str] | None = None,
):
    model = _model_for_tier(tier)
    url = f"{GEMINI_BASE}/models/{model}:streamGenerateContent?alt=sse"
    body = {
        "systemInstruction": {"parts": [{"text": build_system_instruction(context_blocks)}]},
        "contents": [{"role": "user", "parts": [{"text": message}]}],
    }
    timeout = httpx.Timeout(connect=10.0, read=60.0, write=20.0, pool=10.0)

    client = get_client()
    async with client.stream(
        "POST",
        url,
        headers=_auth_headers(),
        json=body,
        timeout=timeout,
    ) as response:
        if response.status_code >= 400:
            text = await response.aread()
            raise RuntimeError(
                f"Gemini {model} returned {response.status_code}: "
                f"{text.decode('utf-8', errors='ignore')}"
            )

        async for line in response.aiter_lines():
            if not line or not line.startswith("data: "):
                continue

            payload = line[len("data: "):].strip()
            if payload == "[DONE]":
                return

            try:
                chunk_json = json.loads(payload)
            except json.JSONDecodeError:
                continue

            text = (
                chunk_json.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text")
            )
            if isinstance(text, str) and text:
                yield text
