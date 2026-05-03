"""LLM provider adapters for BYOK (Bring Your Own Key).

Each provider exposes the same async generator contract:

    async def stream(message: str, *, model: str, api_key: str,
                     system: str | None = None) -> AsyncIterator[str]

so the /chat endpoint can swap providers without branching on each call site.
"""

from .gemini import stream as stream_gemini
from .anthropic import stream as stream_anthropic
from .openai import stream as stream_openai
from .openrouter import stream as stream_openrouter
from .router import stream_byok, BYOKConfig

__all__ = [
    "stream_gemini",
    "stream_anthropic",
    "stream_openai",
    "stream_openrouter",
    "stream_byok",
    "BYOKConfig",
]
