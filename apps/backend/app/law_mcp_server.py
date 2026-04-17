from typing import Any

from mcp.server.fastmcp import FastMCP

from .law_api import LawApiClient, absolute_law_link, normalize_whitespace
from .rag_data import sync_core_statutes, sync_seed_precedents

mcp = FastMCP("LAW.OS Law MCP")


async def _with_client(callback):
    async with LawApiClient() as client:
        return await callback(client)


@mcp.tool()
async def search_current_laws(query: str, limit: int = 10) -> list[dict[str, Any]]:
    async def _run(client: LawApiClient):
        results = await client.search_current_laws(query=query, display=min(max(limit, 1), 20))
        return [
            {
                "law_id": item.get("법령ID"),
                "mst": item.get("법령일련번호"),
                "name": item.get("법령명한글"),
                "kind": item.get("법령구분명"),
                "effective_date": item.get("시행일자"),
                "announcement_date": item.get("공포일자"),
                "status": item.get("현행연혁코드"),
                "detail_link": absolute_law_link(item.get("법령상세링크")),
            }
            for item in results[:limit]
        ]

    return await _with_client(_run)


@mcp.tool()
async def get_current_law_article(law_id: str, article_main: int, article_sub: int = 0) -> dict[str, Any]:
    article_code = f"{article_main:04d}{article_sub:02d}"

    async def _run(client: LawApiClient):
        detail = await client.get_current_law(law_id=law_id, jo=article_code)
        units = detail.get("조문", {}).get("조문단위", [])
        if isinstance(units, dict):
            units = [units]
        row = next((unit for unit in units if unit.get("조문여부") == "조문"), None)
        return {
            "law_id": law_id,
            "law_name": detail.get("기본정보", {}).get("법령명_한글"),
            "article": f"제{article_main}조" + (f"의{article_sub}" if article_sub else ""),
            "title": normalize_whitespace(row.get("조문제목") if row else None),
            "body": normalize_whitespace(row.get("조문내용") if row else None),
        }

    return await _with_client(_run)


@mcp.tool()
async def search_precedents(query: str, limit: int = 10) -> list[dict[str, Any]]:
    async def _run(client: LawApiClient):
        results = await client.search_precedents(query=query, display=min(max(limit, 1), 20))
        return [
            {
                "precedent_id": item.get("판례일련번호"),
                "case_no": item.get("사건번호"),
                "case_name": item.get("사건명"),
                "court": item.get("법원명"),
                "decided_at": item.get("선고일자"),
                "detail_link": absolute_law_link(item.get("판례상세링크")),
            }
            for item in results[:limit]
        ]

    return await _with_client(_run)


@mcp.tool()
async def get_precedent_detail(precedent_id: str) -> dict[str, Any]:
    async def _run(client: LawApiClient):
        detail = await client.get_precedent(precedent_id)
        return {
            "precedent_id": precedent_id,
            "case_no": detail.get("사건번호"),
            "case_name": detail.get("사건명"),
            "court": detail.get("법원명"),
            "decided_at": detail.get("선고일자"),
            "summary": normalize_whitespace(detail.get("판결요지")),
            "judgment_points": normalize_whitespace(detail.get("판시사항")),
            "related_statutes": normalize_whitespace(detail.get("참조조문")),
            "content": normalize_whitespace(detail.get("판례내용")),
        }

    return await _with_client(_run)


@mcp.tool()
async def seed_law_rag_data(include_precedents: bool = True) -> dict[str, int]:
    result = await sync_core_statutes(embed=False)
    if include_precedents:
        precedent_result = await sync_seed_precedents(per_query_limit=3, embed=False)
        result.update(precedent_result)
    return result


if __name__ == "__main__":
    mcp.run()
