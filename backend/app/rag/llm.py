"""
UniAssist AI - LLM integration (OpenRouter, via LangChain's OpenAI-
compatible client).

The OpenRouter API key stays server-side: React only ever talks to
FastAPI's POST /api/chat, and only this module talks to OpenRouter.
"""

from functools import lru_cache

from langchain_openai import ChatOpenAI

from app.rag.config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, OPENROUTER_MODEL


@lru_cache(maxsize=1)
def get_llm() -> ChatOpenAI:
    """Reused OpenRouter chat model - constructed once per process."""
    if not OPENROUTER_API_KEY:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not set. Add it to backend/.env before "
            "using UniAssist AI."
        )
    if not OPENROUTER_MODEL:
        raise RuntimeError(
            "OPENROUTER_MODEL is not set. Add it to backend/.env before "
            "using UniAssist AI."
        )

    return ChatOpenAI(
        model=OPENROUTER_MODEL,
        api_key=OPENROUTER_API_KEY,
        base_url=OPENROUTER_BASE_URL,
        temperature=0.1,
    )
