"""Dispatches a streaming chat request to the right BYOK provider."""

from __future__ import annotations

from dataclasses import dataclass
from typing import AsyncIterator, Literal

from . import anthropic as ant
from . import gemini as gm
from . import openai as oai
from . import openrouter as orouter

Provider = Literal["gemini", "anthropic", "openai", "openrouter"]


@dataclass(frozen=True)
class BYOKConfig:
    provider: Provider
    model: str
    api_key: str

    def __repr__(self) -> str:  # noqa: D401
        # Defensive: prevent accidental logger.info(f"{cfg}") leaking the key
        # into Sentry, Uvicorn access log, or any future structured logger.
        # Show only the first 4 chars of the key, like the mobile UI mask.
        masked = (self.api_key[:4] + "•" * 8) if self.api_key else ""
        return (
            f"BYOKConfig(provider={self.provider!r}, "
            f"model={self.model!r}, api_key={masked!r})"
        )


async def stream_byok(
    cfg: BYOKConfig,
    message: str,
    *,
    system: str | None = None,
) -> AsyncIterator[str]:
    if cfg.provider == "gemini":
        async for chunk in gm.stream(
            message, model=cfg.model, api_key=cfg.api_key, system=system
        ):
            yield chunk
    elif cfg.provider == "anthropic":
        async for chunk in ant.stream(
            message, model=cfg.model, api_key=cfg.api_key, system=system
        ):
            yield chunk
    elif cfg.provider == "openai":
        async for chunk in oai.stream(
            message, model=cfg.model, api_key=cfg.api_key, system=system
        ):
            yield chunk
    elif cfg.provider == "openrouter":
        async for chunk in orouter.stream(
            message, model=cfg.model, api_key=cfg.api_key, system=system
        ):
            yield chunk
    else:
        raise ValueError(f"unknown provider: {cfg.provider}")


async def test_byok(cfg: BYOKConfig) -> bool:
    """Validates the API key by calling the provider's lightest endpoint."""
    if cfg.provider == "gemini":
        return await gm.test_ping(cfg.api_key)
    if cfg.provider == "anthropic":
        return await ant.test_ping(cfg.api_key)
    if cfg.provider == "openai":
        return await oai.test_ping(cfg.api_key)
    if cfg.provider == "openrouter":
        return await orouter.test_ping(cfg.api_key)
    return False
