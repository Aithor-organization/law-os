from __future__ import annotations

from dataclasses import dataclass

from fastapi import HTTPException, status

from .config import get_settings
from .http_client import get_client


@dataclass(frozen=True)
class AuthenticatedUser:
    user_id: str
    email: str | None


async def authenticate_bearer_token(authorization: str | None) -> AuthenticatedUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing_authorization",
        )

    token = authorization.removeprefix("Bearer ").strip()
    settings = get_settings()

    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="server_misconfigured",
        )

    client = get_client()
    response = await client.get(
        f"{settings.supabase_url.rstrip('/')}/auth/v1/user",
        headers={
            "Authorization": f"Bearer {token}",
            "apikey": settings.supabase_anon_key,
        },
        timeout=10.0,
    )

    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid_token",
        )

    payload = response.json()
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid_token",
        )

    return AuthenticatedUser(user_id=user_id, email=payload.get("email"))
