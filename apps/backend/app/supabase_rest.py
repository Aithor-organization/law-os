from __future__ import annotations

from typing import Any

import httpx

from .config import get_settings
from .http_client import get_client


class SupabaseRestClient:
    def __init__(self) -> None:
        settings = get_settings()
        self.base_url = settings.supabase_url.rstrip("/") if settings.supabase_url else None
        self.service_role_key = settings.supabase_service_role_key
        self.anon_key = settings.supabase_anon_key

    def _headers(self, *, service_role: bool = False) -> dict[str, str]:
        key = self.service_role_key if service_role and self.service_role_key else self.anon_key
        if not self.base_url or not key:
            raise RuntimeError("Supabase REST client is not configured")
        return {
            "apikey": key,
            "Authorization": f"Bearer {key}",
        }

    def _url(self, path: str) -> str:
        return f"{self.base_url}/rest/v1/{path.lstrip('/')}"

    async def get(
        self,
        path: str,
        *,
        params: dict[str, Any],
        service_role: bool = False,
    ) -> httpx.Response:
        client = get_client()
        return await client.get(
            self._url(path),
            headers=self._headers(service_role=service_role),
            params=params,
            timeout=15.0,
        )

    async def post(
        self,
        path: str,
        *,
        json_body: Any,
        service_role: bool = False,
        prefer: str | None = None,
    ) -> httpx.Response:
        headers = self._headers(service_role=service_role)
        headers["content-type"] = "application/json"
        if prefer:
            headers["Prefer"] = prefer
        client = get_client()
        return await client.post(
            self._url(path),
            headers=headers,
            json=json_body,
            timeout=30.0,
        )

    async def patch(
        self,
        path: str,
        *,
        params: dict[str, Any],
        json_body: Any,
        service_role: bool = False,
    ) -> httpx.Response:
        headers = self._headers(service_role=service_role)
        headers["content-type"] = "application/json"
        client = get_client()
        return await client.patch(
            self._url(path),
            headers=headers,
            params=params,
            json=json_body,
            timeout=15.0,
        )

    async def delete(
        self,
        path: str,
        *,
        params: dict[str, Any],
        service_role: bool = False,
    ) -> httpx.Response:
        client = get_client()
        return await client.delete(
            self._url(path),
            headers=self._headers(service_role=service_role),
            params=params,
            timeout=15.0,
        )

    async def rpc(
        self,
        function_name: str,
        *,
        json_body: Any,
        service_role: bool = True,
    ) -> httpx.Response:
        headers = self._headers(service_role=service_role)
        headers["content-type"] = "application/json"
        client = get_client()
        return await client.post(
            f"{self.base_url}/rest/v1/rpc/{function_name}",
            headers=headers,
            json=json_body,
            timeout=15.0,
        )
