"""Gemini BYOK adapter — same SSE contract as the built-in `app.gemini` module
but takes the user's API key from request headers instead of env."""

from __future__ import annotations

import json
from typing import AsyncIterator

import httpx

from ..http_client import get_client

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"


async def stream(
    message: str,
    *,
    model: str,
    api_key: str,
    system: str | None = None,
) -> AsyncIterator[str]:
    url = f"{GEMINI_BASE}/models/{model}:streamGenerateContent?alt=sse&key={api_key}"
    body: dict = {
        "contents": [{"role": "user", "parts": [{"text": message}]}],
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}

    timeout = httpx.Timeout(connect=10.0, read=60.0, write=20.0, pool=10.0)
    client = get_client()
    async with client.stream(
        "POST", url, json=body, timeout=timeout
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
                chunk = json.loads(payload)
            except json.JSONDecodeError:
                continue
            text = (
                chunk.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text")
            )
            if isinstance(text, str) and text:
                yield text


async def test_ping(api_key: str) -> bool:
    """Validates the key by listing models. Returns True if 200 OK."""
    client = get_client()
    response = await client.get(
        f"{GEMINI_BASE}/models?key={api_key}", timeout=10.0
    )
    return response.status_code == 200
