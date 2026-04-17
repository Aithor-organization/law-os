from __future__ import annotations

import logging
from typing import Sequence

from .rag import CitationCandidate
from .supabase_rest import SupabaseRestClient

logger = logging.getLogger("law-os-backend.chat-store")


async def persist_assistant_message(
    *,
    user_id: str,
    conversation_id: str | None,
    content: str,
    model: str,
    citations: Sequence[CitationCandidate],
) -> dict[str, str] | None:
    if not conversation_id or not content.strip():
        return None

    client = SupabaseRestClient()
    if not client.service_role_key:
        logger.warning("assistant persistence skipped: SUPABASE_SERVICE_ROLE_KEY missing")
        return None

    conversation_response = await client.get(
        "conversations",
        params={
            "select": "id,user_id",
            "id": f"eq.{conversation_id}",
            "user_id": f"eq.{user_id}",
            "limit": "1",
        },
        service_role=True,
    )
    if conversation_response.status_code >= 400:
        raise RuntimeError(
            "conversation lookup failed: "
            f"{conversation_response.status_code} {conversation_response.text}"
        )

    conversations = conversation_response.json()
    if not conversations:
        logger.warning(
            "assistant persistence skipped: conversation not owned by user user_id=%s conversation_id=%s",
            user_id,
            conversation_id,
        )
        return None

    message_response = await client.post(
        "messages",
        json_body={
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": content,
            "model": model,
        },
        service_role=True,
        prefer="return=representation",
    )
    if message_response.status_code >= 400:
        raise RuntimeError(
            f"assistant message insert failed: {message_response.status_code} {message_response.text}"
        )

    message_payload = message_response.json()
    if not isinstance(message_payload, list) or not message_payload:
        raise RuntimeError("assistant message insert returned empty payload")

    message_id = message_payload[0].get("id")
    if not message_id:
        raise RuntimeError("assistant message insert missing id")

    citation_rows = [
        {
            "message_id": message_id,
            "source_type": citation.source_type,
            "source_id": citation.source_id,
            "snippet": citation.snippet,
            "score": citation.score,
        }
        for citation in citations
        if citation.snippet.strip()
    ]
    if citation_rows:
        citation_response = await client.post(
            "citations",
            json_body=citation_rows,
            service_role=True,
        )
        if citation_response.status_code >= 400:
            raise RuntimeError(
                f"citation insert failed: {citation_response.status_code} {citation_response.text}"
            )

    return {"message_id": message_id, "conversation_id": conversation_id}
