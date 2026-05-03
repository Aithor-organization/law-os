"""OpenAI BYOK adapter — Chat Completions with SSE streaming."""

from __future__ import annotations

import json
from typing import AsyncIterator

import httpx

from ..http_client import get_client

OPENAI_BASE = "https://api.openai.com/v1"


async def stream(
    message: str,
    *,
    model: str,
    api_key: str,
    system: str | None = None,
) -> AsyncIterator[str]:
    url = f"{OPENAI_BASE}/chat/completions"
    messages: list[dict] = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": message})
    body = {"model": model, "stream": True, "messages": messages}

    timeout = httpx.Timeout(connect=10.0, read=60.0, write=20.0, pool=10.0)
    client = get_client()
    async with client.stream(
        "POST",
        url,
        json=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "content-type": "application/json",
        },
        timeout=timeout,
    ) as response:
        if response.status_code >= 400:
            text = await response.aread()
            raise RuntimeError(
                f"OpenAI {model} returned {response.status_code}: "
                f"{text.decode('utf-8', errors='ignore')}"
            )

        async for line in response.aiter_lines():
            if not line or not line.startswith("data: "):
                continue
            payload = line[len("data: "):].strip()
            if payload == "[DONE]":
                return
            try:
                evt = json.loads(payload)
            except json.JSONDecodeError:
                continue
            choices = evt.get("choices", [])
            if not choices:
                continue
            delta = choices[0].get("delta", {})
            text = delta.get("content")
            if isinstance(text, str) and text:
                yield text


async def test_ping(api_key: str) -> bool:
    """Lists models to verify the key. Returns True if 200 OK."""
    client = get_client()
    response = await client.get(
        f"{OPENAI_BASE}/models",
        headers={"Authorization": f"Bearer {api_key}"},
        timeout=10.0,
    )
    return response.status_code == 200
