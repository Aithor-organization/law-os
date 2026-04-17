from __future__ import annotations

import asyncio
import json
import os
import secrets
import sys
import time
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
BACKEND_URL = os.getenv("LAWOS_BACKEND_URL", "http://127.0.0.1:8010").rstrip("/")


def require_env(name: str, value: str) -> None:
    if not value:
        raise RuntimeError(f"missing required env: {name}")


def admin_headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "content-type": "application/json",
    }


def user_headers(token: str) -> dict[str, str]:
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {token}",
        "content-type": "application/json",
    }


async def create_temp_user(client: httpx.AsyncClient) -> tuple[str, str, str]:
    email = f"e2e-{int(time.time())}-{secrets.token_hex(4)}@lawos.local"
    password = f"LawOs!{secrets.token_hex(8)}"
    response = await client.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=admin_headers(),
        json={
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"name": "LAW.OS E2E"},
        },
    )
    response.raise_for_status()
    user_id = response.json()["id"]
    return user_id, email, password


async def sign_in(client: httpx.AsyncClient, email: str, password: str) -> tuple[str, str]:
    response = await client.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_ANON_KEY, "content-type": "application/json"},
        json={"email": email, "password": password},
    )
    response.raise_for_status()
    payload = response.json()
    return payload["access_token"], payload["user"]["id"]


async def insert_conversation(client: httpx.AsyncClient, token: str, user_id: str) -> str:
    response = await client.post(
        f"{SUPABASE_URL}/rest/v1/conversations",
        headers={**user_headers(token), "Prefer": "return=representation"},
        json={
            "user_id": user_id,
            "title": "E2E verification conversation",
            "mode": "normal",
        },
    )
    response.raise_for_status()
    return response.json()[0]["id"]


async def insert_user_message(client: httpx.AsyncClient, token: str, conversation_id: str, content: str) -> str:
    response = await client.post(
        f"{SUPABASE_URL}/rest/v1/messages",
        headers={**user_headers(token), "Prefer": "return=representation"},
        json={
            "conversation_id": conversation_id,
            "role": "user",
            "content": content,
        },
    )
    response.raise_for_status()
    return response.json()[0]["id"]


async def call_search(client: httpx.AsyncClient, token: str) -> dict[str, Any]:
    response = await client.post(
        f"{BACKEND_URL}/search",
        headers=user_headers(token),
        json={"query": "민법 750조", "target": "all", "limit": 5},
    )
    response.raise_for_status()
    return response.json()


async def verify_search_writeback(client: httpx.AsyncClient, user_id: str) -> dict[str, Any]:
    response = await client.get(
        f"{SUPABASE_URL}/rest/v1/search_history",
        headers=admin_headers(),
        params={
            "select": "id,query,result_type,result_count,searched_at",
            "user_id": f"eq.{user_id}",
            "order": "searched_at.desc",
            "limit": "1",
        },
    )
    response.raise_for_status()
    rows = response.json()
    if not rows:
        raise RuntimeError("search_history write-back missing")
    return rows[0]


async def call_chat(client: httpx.AsyncClient, token: str, conversation_id: str, message: str) -> str:
    async with client.stream(
        "POST",
        f"{BACKEND_URL}/chat",
        headers=user_headers(token),
        json={"message": message, "tier": "flash", "conversationId": conversation_id},
        timeout=120.0,
    ) as response:
        response.raise_for_status()
        aggregated = ""
        async for line in response.aiter_lines():
            if not line.startswith("data: "):
                continue
            payload = line.removeprefix("data: ").strip()
            if payload == "[DONE]":
                break
            data = json.loads(payload)
            if "error" in data:
                raise RuntimeError(f"chat stream error: {data['error']}")
            aggregated += data.get("text", "")
        if not aggregated.strip():
            raise RuntimeError("chat returned empty response")
        return aggregated


async def verify_chat_persistence(client: httpx.AsyncClient, conversation_id: str) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    response = await client.get(
        f"{SUPABASE_URL}/rest/v1/messages",
        headers=admin_headers(),
        params={
            "select": "id,role,content,model,created_at",
            "conversation_id": f"eq.{conversation_id}",
            "role": "eq.assistant",
            "order": "created_at.desc",
            "limit": "1",
        },
    )
    response.raise_for_status()
    messages = response.json()
    if not messages:
        raise RuntimeError("assistant message persistence missing")
    assistant = messages[0]

    citation_response = await client.get(
        f"{SUPABASE_URL}/rest/v1/citations",
        headers=admin_headers(),
        params={
            "select": "id,source_type,source_id,snippet,score",
            "message_id": f"eq.{assistant['id']}",
            "order": "created_at.asc",
        },
    )
    citation_response.raise_for_status()
    citations = citation_response.json()
    if not citations:
        raise RuntimeError("citation persistence missing")
    return assistant, citations


async def cleanup_user(client: httpx.AsyncClient, user_id: str) -> None:
    response = await client.delete(
        f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
        headers=admin_headers(),
    )
    response.raise_for_status()


async def main() -> None:
    require_env("SUPABASE_URL", SUPABASE_URL)
    require_env("SUPABASE_ANON_KEY", SUPABASE_ANON_KEY)
    require_env("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY)

    async with httpx.AsyncClient() as client:
        user_id = ""
        try:
            user_id, email, password = await create_temp_user(client)
            token, signed_user_id = await sign_in(client, email, password)
            if signed_user_id != user_id:
                raise RuntimeError("signed-in user mismatch")

            conversation_id = await insert_conversation(client, token, user_id)
            await insert_user_message(client, token, conversation_id, "민법 제750조 불법행위가 뭔가요?")

            search_payload = await call_search(client, token)
            history_row = await verify_search_writeback(client, user_id)

            chat_text = await call_chat(
                client,
                token,
                conversation_id,
                "민법 제750조와 관련 판례를 학습용으로 간단히 설명해줘",
            )
            assistant_row, citations = await verify_chat_persistence(client, conversation_id)

            print(
                json.dumps(
                    {
                        "ok": True,
                        "userId": user_id,
                        "conversationId": conversation_id,
                        "search": {
                            "target": search_payload.get("target"),
                            "total": search_payload.get("total"),
                            "top": search_payload.get("items", [])[:2],
                            "history": history_row,
                        },
                        "chat": {
                            "assistantMessageId": assistant_row["id"],
                            "assistantChars": len(chat_text),
                            "citationCount": len(citations),
                            "citations": citations[:3],
                        },
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
        finally:
            if user_id:
                await cleanup_user(client, user_id)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:  # noqa: BLE001
        print(f"E2E verification failed: {exc}", file=sys.stderr)
        sys.exit(1)
