"""Anthropic BYOK adapter — Messages API with SSE streaming."""

from __future__ import annotations

import json
from typing import AsyncIterator

import httpx

from ..http_client import get_client

ANTHROPIC_BASE = "https://api.anthropic.com/v1"
ANTHROPIC_VERSION = "2023-06-01"


async def stream(
    message: str,
    *,
    model: str,
    api_key: str,
    system: str | None = None,
) -> AsyncIterator[str]:
    url = f"{ANTHROPIC_BASE}/messages"
    body: dict = {
        "model": model,
        "max_tokens": 4096,
        "stream": True,
        "messages": [{"role": "user", "content": message}],
    }
    if system:
        body["system"] = system

    timeout = httpx.Timeout(connect=10.0, read=60.0, write=20.0, pool=10.0)
    client = get_client()
    async with client.stream(
        "POST",
        url,
        json=body,
        headers={
            "x-api-key": api_key,
            "anthropic-version": ANTHROPIC_VERSION,
            "content-type": "application/json",
        },
        timeout=timeout,
    ) as response:
        if response.status_code >= 400:
            text = await response.aread()
            raise RuntimeError(
                f"Anthropic {model} returned {response.status_code}: "
                f"{text.decode('utf-8', errors='ignore')}"
            )

        async for line in response.aiter_lines():
            if not line or not line.startswith("data: "):
                continue
            payload = line[len("data: "):].strip()
            if not payload or payload == "[DONE]":
                continue
            try:
                evt = json.loads(payload)
            except json.JSONDecodeError:
                continue
            # content_block_delta carries streamed text
            if evt.get("type") == "content_block_delta":
                delta = evt.get("delta", {})
                if delta.get("type") == "text_delta":
                    text = delta.get("text")
                    if isinstance(text, str) and text:
                        yield text


async def test_ping(api_key: str) -> bool:
    """Sends a 1-token request to verify the key. Returns True if 200 OK."""
    client = get_client()
    response = await client.post(
        f"{ANTHROPIC_BASE}/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": ANTHROPIC_VERSION,
            "content-type": "application/json",
        },
        json={
            "model": "claude-haiku-4-5",
            "max_tokens": 1,
            "messages": [{"role": "user", "content": "hi"}],
        },
        timeout=10.0,
    )
    return response.status_code == 200
