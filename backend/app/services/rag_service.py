
"""
UniAssist AI - runtime RAG coordinator with web fallback.
"""

import logging

from fastapi import HTTPException, status
from langchain_core.messages import HumanMessage, SystemMessage

from app.rag.llm import get_llm
from app.rag.prompt import build_prompt_messages
from app.rag.retriever import retrieve
from app.schemas.rag import ChatResponse, SourceItem
from app.services.web_search import search_web

logger = logging.getLogger(__name__)

UNAVAILABLE_PHRASES = (
    "not available in the university knowledge base",
    "not found in the university knowledge base",
    "does not contain enough information",
)


def _needs_web_fallback(answer: str) -> bool:
    """Check whether the local answer explicitly indicates missing evidence."""
    normalized = answer.lower()
    return any(phrase in normalized for phrase in UNAVAILABLE_PHRASES)


def _answer_from_web(llm, question: str, results: list[dict]) -> str:
    """Generate an answer grounded only in the retrieved web results."""

    web_context = "\n\n---\n\n".join(
        f"Title: {item['title']}\n"
        f"URL: {item['url']}\n"
        f"Content: {item['content']}"
        for item in results
    )

    messages = [
        SystemMessage(
            content=(
                "You are UniAssist AI. The local university knowledge base "
                "did not provide enough information for this question.\n"
                "Answer using only the supplied web search results. "
                "Treat them as external sources, not official university "
                "policy unless the source itself establishes that.\n"
                "Prefer official AIUB sources for university-specific facts. "
                "Do not invent facts or claim that a policy is official "
                "without evidence. If the results are insufficient, say so.\n"
                "Include relevant source URLs in your answer."
            )
        ),
        HumanMessage(
            content=(
                f"Question:\n{question}\n\n"
                f"Web search results:\n{web_context}"
            )
        ),
    ]

    response = llm.invoke(messages)
    return response.content


def answer_question(message: str) -> ChatResponse:
    """
    Try local RAG first. Search the web only when the local answer
    explicitly indicates that relevant information is unavailable.
    """

    # 1. Existing local hybrid retrieval.
    try:
        chunks = retrieve(message)
    except Exception as exc:
        logger.exception("Local knowledge-base retrieval failed.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "UniAssist AI's knowledge base is currently unavailable. "
                "Please try again shortly."
            ),
        ) from exc

    local_sources = [
        SourceItem(
            document=chunk["source"],
            chunk_id=chunk["chunk_id"],
        )
        for chunk in chunks
    ]

    # 2. Generate the usual answer from local university documents.
    try:
        llm = get_llm()
        messages = build_prompt_messages(message, chunks)
        response = llm.invoke(messages)
        answer_text = response.content

    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception("UniAssist LLM request failed.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "UniAssist AI could not reach the language model. "
                "Please try again shortly."
            ),
        ) from exc

    # 3. Preserve the local answer if it contains sufficient information.
    if not _needs_web_fallback(answer_text):
        return ChatResponse(answer=answer_text, sources=local_sources)

    # 4. Local answer indicates missing information: try Tavily.
    logger.info("Web fallback triggered for: %s", message)
    web_results = search_web(message)
    logger.info("Web fallback received %d results", len(web_results))
    if not web_results:
        logger.info("No web results available; returning local answer.")
        return ChatResponse(answer=answer_text, sources=local_sources)

    # 5. Generate a web-grounded answer.
    try:
        web_answer = _answer_from_web(llm, message, web_results)

        web_sources = [
            SourceItem(
                document=f"Web: {item['title']}",
                chunk_id=item["url"],
            )
            for item in web_results
        ]

        return ChatResponse(answer=web_answer, sources=web_sources)

    except Exception:
        logger.exception(
            "Web-based answer generation failed; returning local answer."
        )
        return ChatResponse(answer=answer_text, sources=local_sources)
