"""BYOK header parsing + rate limit gate.

Centralizes the "did the request bring its own LLM key?" decision so the /chat
endpoint stays readable. When BYOK is absent, calls Supabase RPC
`consume_free_chat()` to atomically decrement the daily quota and decide
whether to allow the request.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Literal

from fastapi import HTTPException, status

from .llm import BYOKConfig
from .supabase_rest import SupabaseRestClient

logger = logging.getLogger("law-os-backend.byok")

Provider = Literal["gemini", "anthropic", "openai", "openrouter"]
_VALID_PROVIDERS: set[str] = {"gemini", "anthropic", "openai", "openrouter"}

# Model ID whitelist regex.
# - alphanum, hyphen, underscore, dot for version numbers (e.g., "claude-haiku-4-5", "gpt-5.4-mini")
# - colon for OpenRouter route prefixes (e.g., "anthropic/claude-3.5-sonnet:beta")
# - slash for namespace (e.g., "google/gemini-3-flash")
# - max 100 chars to prevent path-injection / SSRF attempts via crafted URLs.
_MODEL_ID_RE = re.compile(r"^[a-zA-Z0-9\-_/:.]{1,100}$")


def parse_byok_headers(
    provider: str | None,
    model: str | None,
    api_key: str | None,
) -> BYOKConfig | None:
    """Returns BYOKConfig if all three headers are present and valid; otherwise
    returns None. Raises 400 if some but not all are present."""
    present = [bool(provider), bool(model), bool(api_key)]
    if not any(present):
        return None
    if not all(present):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="byok_partial_headers",
        )
    if provider not in _VALID_PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"byok_unknown_provider:{provider}",
        )
    if model:
        # Reject crafted model IDs to prevent path traversal / SSRF in
        # provider URL construction (especially OpenRouter, which embeds
        # model IDs into request bodies that hit upstream URLs).
        # The regex alone allows ".", "/", ":" so we also reject the
        # specific subsequences that compose dangerous URLs/paths.
        if (
            not _MODEL_ID_RE.match(model)
            or ".." in model
            or "://" in model
            or model.startswith("/")
            or model.startswith(".")
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="byok_invalid_model_id",
            )
    return BYOKConfig(
        provider=provider,  # type: ignore[arg-type]
        model=model or "",
        api_key=api_key or "",
    )


@dataclass(frozen=True)
class RateLimitResult:
    allowed: bool
    used: int
    bonus: int
    limit: int


async def consume_free_chat(user_jwt: str) -> RateLimitResult:
    """Atomically increments the user's daily counter via RPC and returns the
    new state. Resets at KST midnight automatically."""
    client = SupabaseRestClient()
    response = await client.rpc_as_user(
        "consume_free_chat", user_jwt=user_jwt
    )
    if response.status_code != 200:
        logger.error(
            "consume_free_chat RPC failed status=%s body=%s",
            response.status_code, response.text[:300]
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="rate_limit_rpc_failed",
        )
    data = response.json()
    return RateLimitResult(
        allowed=bool(data.get("allowed", False)),
        used=int(data.get("used", 0)),
        bonus=int(data.get("bonus", 0)),
        limit=int(data.get("limit", 5)),
    )
