from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.http_client import build_client, set_client
from app.rag_data import sync_core_statutes, sync_seed_precedents


async def main() -> None:
    parser = argparse.ArgumentParser(description="Sync LAW.OS RAG seed data from the official law API")
    parser.add_argument("--with-precedents", action="store_true", help="Also sync seed precedents")
    parser.add_argument("--embed", action="store_true", help="Generate Gemini embeddings during sync")
    parser.add_argument(
        "--precedent-limit",
        type=int,
        default=100,
        help="Per-query precedent fetch limit (law API max: ~100)",
    )
    parser.add_argument(
        "--skip-statutes",
        action="store_true",
        help="Skip statute sync (only run precedent sync)",
    )
    args = parser.parse_args()

    # Scripts don't run inside the FastAPI lifespan, so wire up the shared
    # HTTP client manually for the duration of this invocation.
    client = build_client()
    set_client(client)
    result: dict[str, int] = {}
    try:
        if not args.skip_statutes:
            result.update(await sync_core_statutes(embed=args.embed))
        if args.with_precedents:
            result.update(
                await sync_seed_precedents(per_query_limit=args.precedent_limit, embed=args.embed)
            )
    finally:
        set_client(None)
        await client.aclose()

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
