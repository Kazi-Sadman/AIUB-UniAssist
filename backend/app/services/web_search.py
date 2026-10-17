
import logging
import os

from dotenv import load_dotenv
from tavily import TavilyClient

load_dotenv()

logger = logging.getLogger(__name__)


def search_web(query: str, max_results: int = 5) -> list[dict]:
    """Search the web using Tavily and return useful source details."""

    if os.getenv("WEB_SEARCH_ENABLED", "true").lower() != "true":
        return []

    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        logger.warning("TAVILY_API_KEY is not configured.")
        return []

    try:
        client = TavilyClient(api_key=api_key)
        response = client.search(
            query=query,
            search_depth="basic",
            max_results=max_results,
        )

        results = []
        for item in response.get("results", []):
            url = item.get("url", "")
            if not url:
                continue

            results.append({
                "title": item.get("title", "Web source"),
                "url": url,
                "content": item.get("content", ""),
            })
        logger.info("Tavily returned %d results", len(results))
        return results

    except Exception:
        logger.exception("Tavily web search failed.")
        return []
