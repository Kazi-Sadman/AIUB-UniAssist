"""
UniAssist AI - optional second-stage reranker.

Behind ENABLE_RERANKER=false (the default), rerank() is a no-op
passthrough - the RRF-fused order is kept as-is. Set
ENABLE_RERANKER=true to enable a cross-encoder reranker; the
sentence-transformers cross-encoder model is loaded once, lazily, only
if reranking is actually turned on.
"""

from functools import lru_cache
from typing import Dict, List

DEFAULT_RERANKER_MODEL = "BAAI/bge-reranker-base"


@lru_cache(maxsize=1)
def _get_cross_encoder():
    """Load the cross-encoder reranker once, only when first needed."""
    from sentence_transformers import CrossEncoder

    from app.rag.config import MODEL_CACHE_DIR

    return CrossEncoder(DEFAULT_RERANKER_MODEL, cache_folder=MODEL_CACHE_DIR)


def rerank(query: str, candidates: List[Dict]) -> List[Dict]:
    """
    Re-score `candidates` (already RRF-fused) against the query using a
    cross-encoder, and return them re-sorted best-first.

    Falls back to the original RRF order (with a warning) if the
    cross-encoder cannot be loaded, so a missing/failed reranker never
    breaks the chat endpoint.
    """
    if not candidates:
        return candidates

    try:
        model = _get_cross_encoder()
    except Exception as exc:  # pragma: no cover - defensive fallback
        print(f"[UniAssist AI] Reranker unavailable, using RRF order instead: {exc}")
        return candidates

    pairs = [(query, candidate["text"]) for candidate in candidates]
    scores = model.predict(pairs)

    reranked = [
        {**candidate, "rerank_score": float(score)}
        for candidate, score in zip(candidates, scores)
    ]
    reranked.sort(key=lambda c: c["rerank_score"], reverse=True)
    return reranked
