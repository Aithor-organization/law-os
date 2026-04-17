from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    supabase_url: str | None
    supabase_anon_key: str | None
    supabase_service_role_key: str | None
    supabase_jwt_secret: str | None
    gemini_api_key: str | None
    gemini_model_flash: str
    gemini_model_pro: str
    gemini_embedding_model: str
    law_api_oc: str | None
    law_sync_secret: str | None
    cors_origins: list[str]
    environment: str


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    default_origins = "http://localhost:8081,http://127.0.0.1:8081,http://localhost:3000,http://127.0.0.1:3000"
    origins = os.getenv("BACKEND_CORS_ORIGINS", default_origins)

    return Settings(
        supabase_url=os.getenv("SUPABASE_URL"),
        supabase_anon_key=os.getenv("SUPABASE_ANON_KEY"),
        supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
        supabase_jwt_secret=os.getenv("SUPABASE_JWT_SECRET"),
        gemini_api_key=os.getenv("GEMINI_API_KEY"),
        gemini_model_flash=os.getenv("GEMINI_MODEL_FLASH", "gemini-2.5-flash"),
        gemini_model_pro=os.getenv("GEMINI_MODEL_PRO", "gemini-2.5-pro"),
        gemini_embedding_model=os.getenv(
            "GEMINI_EMBEDDING_MODEL", "gemini-embedding-001"
        ),
        law_api_oc=os.getenv("LAW_API_OC"),
        law_sync_secret=os.getenv("LAW_SYNC_SECRET"),
        cors_origins=[origin.strip() for origin in origins.split(",") if origin.strip()],
        environment=os.getenv("ENVIRONMENT", "development").lower(),
    )


def validate_settings(settings: Settings) -> None:
    missing: list[str] = []
    if not settings.supabase_url:
        missing.append("SUPABASE_URL")
    if not settings.supabase_anon_key:
        missing.append("SUPABASE_ANON_KEY")
    if not settings.gemini_api_key:
        missing.append("GEMINI_API_KEY")

    if missing:
        raise RuntimeError(
            f"Required environment variables missing: {', '.join(missing)}"
        )

    if settings.environment == "production" and not settings.cors_origins:
        raise RuntimeError(
            "BACKEND_CORS_ORIGINS must be set in production environment"
        )
