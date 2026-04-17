from __future__ import annotations

import re
from typing import Any
from urllib.parse import urljoin

import httpx

from .config import get_settings

LAW_API_BASE = "https://www.law.go.kr"
LAW_SEARCH_PATH = "/DRF/lawSearch.do"
LAW_SERVICE_PATH = "/DRF/lawService.do"


class LawApiClient:
    def __init__(self) -> None:
        settings = get_settings()
        self.oc = settings.law_api_oc
        timeout = httpx.Timeout(connect=10.0, read=30.0, write=15.0, pool=10.0)
        self.client = httpx.AsyncClient(base_url=LAW_API_BASE, timeout=timeout)

    async def __aenter__(self) -> LawApiClient:
        return self

    async def __aexit__(self, *_args: object) -> None:
        await self.client.aclose()

    def _base_params(self, target: str) -> dict[str, str]:
        if not self.oc:
            raise RuntimeError("LAW_API_OC not set")
        return {"OC": self.oc, "target": target, "type": "JSON"}

    async def search_current_laws(
        self,
        *,
        query: str,
        search: int = 1,
        display: int = 100,
        page: int = 1,
        nw: str = "3",
    ) -> list[dict[str, Any]]:
        params = self._base_params("eflaw")
        params.update(
            {
                "query": query,
                "search": str(search),
                "display": str(display),
                "page": str(page),
                "nw": nw,
            }
        )
        response = await self.client.get(LAW_SEARCH_PATH, params=params)
        response.raise_for_status()
        payload = response.json().get("LawSearch", {})
        laws = payload.get("law", [])
        return laws if isinstance(laws, list) else [laws]

    async def get_current_law(
        self,
        *,
        law_id: str | None = None,
        mst: str | None = None,
        ef_yd: str | None = None,
        jo: str | None = None,
    ) -> dict[str, Any]:
        params = self._base_params("eflaw")
        if law_id:
            params["ID"] = law_id
        if mst:
            params["MST"] = mst
        if ef_yd:
            params["efYd"] = ef_yd
        if jo:
            params["JO"] = jo
        response = await self.client.get(LAW_SERVICE_PATH, params=params)
        response.raise_for_status()
        return response.json().get("법령", {})

    async def find_exact_current_law(self, title: str) -> dict[str, Any] | None:
        laws = await self.search_current_laws(query=title)
        exact_matches = [law for law in laws if law.get("법령명한글") == title and law.get("현행연혁코드") == "현행"]
        if exact_matches:
            exact_matches.sort(key=lambda item: item.get("시행일자", ""), reverse=True)
            return exact_matches[0]
        return None

    async def search_precedents(
        self,
        *,
        query: str,
        search: int = 1,
        display: int = 20,
        page: int = 1,
    ) -> list[dict[str, Any]]:
        params = self._base_params("prec")
        params.update(
            {
                "query": query,
                "search": str(search),
                "display": str(display),
                "page": str(page),
            }
        )
        response = await self.client.get(LAW_SEARCH_PATH, params=params)
        response.raise_for_status()
        payload = response.json().get("PrecSearch", {})
        precedents = payload.get("prec", [])
        return precedents if isinstance(precedents, list) else [precedents]

    async def get_precedent(self, precedent_id: str) -> dict[str, Any]:
        params = self._base_params("prec")
        params["ID"] = precedent_id
        response = await self.client.get(LAW_SERVICE_PATH, params=params)
        response.raise_for_status()
        return response.json().get("PrecService", {})


def normalize_whitespace(value: object) -> str:
    # The law API occasionally returns lists/dicts for complex articles (e.g.,
    # 대한민국헌법 articles with multiple clauses). Flatten to a single string
    # before regex cleanup.
    if value is None:
        return ""
    if isinstance(value, list):
        value = "\n".join(normalize_whitespace(item) for item in value if item is not None)
    elif isinstance(value, dict):
        # Prefer a known content key, otherwise stringify all leaf strings.
        for key in ("조문내용", "내용", "content", "text"):
            if key in value and value[key]:
                value = value[key]
                return normalize_whitespace(value)
        value = "\n".join(
            normalize_whitespace(v) for v in value.values() if v is not None
        )
    elif not isinstance(value, str):
        value = str(value)

    if not value:
        return ""
    compact = re.sub(r"<br\s*/?>", "\n", value)
    compact = re.sub(r"<[^>]+>", "", compact)
    compact = compact.replace("\xa0", " ")
    compact = re.sub(r"\n{3,}", "\n\n", compact)
    compact = re.sub(r"[ \t]{2,}", " ", compact)
    return compact.strip()


def absolute_law_link(relative_link: str | None) -> str | None:
    if not relative_link:
        return None
    return urljoin(LAW_API_BASE, relative_link)
