"""
UniAssist AI - runtime RAG coordinator.

Mirrors the pattern of the existing services (department_service.py,
student_service.py, ...): the route stays thin, and this module holds
the actual logic. No indexing happens here - only retrieval + LLM call
against the already-built Qdrant/BM25 indexes.
"""

from fastapi import HTTPException, status

from app.rag.llm import get_llm
from app.rag.prompt import build_prompt_messages
from app.rag.retriever import retrieve
from app.schemas.rag import ChatResponse, SourceItem


def answer_question(message: str) -> ChatResponse:
    """
    Run hybrid retrieval + grounded LLM generation for a user question
    and return the answer with its supporting sources.
    """
    try:
        chunks = retrieve(message)
    except Exception as exc:
        # Covers: Qdrant unavailable/collection missing, embedding model
        # failure, BM25 index missing, etc.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="UniAssist AI's knowledge base is currently unavailable. "
            "Please try again shortly.",
        ) from exc

    try:
        llm = get_llm()
        messages = build_prompt_messages(message, chunks)
        response = llm.invoke(messages)
        answer_text = response.content
    except RuntimeError as exc:
        # Missing OPENROUTER_API_KEY / OPENROUTER_MODEL configuration.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        # Covers: OpenRouter unavailable, invalid key, LLM timeout, etc.
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="UniAssist AI could not reach the language model. "
            "Please try again shortly.",
        ) from exc

    sources = [
        SourceItem(document=chunk["source"], chunk_id=chunk["chunk_id"])
        for chunk in chunks
    ]

    return ChatResponse(answer=answer_text, sources=sources)
