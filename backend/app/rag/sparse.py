"""
UniAssist AI - BM25 sparse retrieval.

Built once during `python scripts/rebuild_index.py` over the exact same
chunks that go into Qdrant, then persisted to disk (backend/data/bm25/)
and loaded once per process at query time. Never rebuilt on a chat
request.
"""

import pickle
import re
from functools import lru_cache
from typing import Dict, List, Optional, Tuple

from rank_bm25 import BM25Okapi

from app.rag.config import BM25_CHUNKS_PATH, BM25_DIR, BM25_INDEX_PATH

_TOKEN_RE = re.compile(r"[A-Za-z0-9]+")


def _tokenize(text: str) -> List[str]:
    return _TOKEN_RE.findall(text.lower())


def build_bm25(chunks: List[Dict]) -> Tuple[BM25Okapi, List[Dict]]:
    """
    Build a BM25 index over the given chunks.

    `chunks` items must contain: text, source, chunk_id, chunk_index.
    """
    tokenized_corpus = [_tokenize(chunk["text"]) for chunk in chunks]
    bm25 = BM25Okapi(tokenized_corpus)
    return bm25, chunks


def save_bm25(bm25: BM25Okapi, chunks: List[Dict]) -> None:
    """Persist the BM25 index and its backing chunks to disk."""
    BM25_DIR.mkdir(parents=True, exist_ok=True)
    with open(BM25_INDEX_PATH, "wb") as f:
        pickle.dump(bm25, f)
    with open(BM25_CHUNKS_PATH, "wb") as f:
        pickle.dump(chunks, f)


def _load_from_disk() -> Optional[Tuple[BM25Okapi, List[Dict]]]:
    if not BM25_INDEX_PATH.exists() or not BM25_CHUNKS_PATH.exists():
        return None
    with open(BM25_INDEX_PATH, "rb") as f:
        bm25 = pickle.load(f)
    with open(BM25_CHUNKS_PATH, "rb") as f:
        chunks = pickle.load(f)
    return bm25, chunks


@lru_cache(maxsize=1)
def _cached_bm25() -> Optional[Tuple[BM25Okapi, List[Dict]]]:
    """Load the persisted BM25 index once per process and reuse it."""
    return _load_from_disk()


def reload_bm25_cache() -> None:
    """Force the next call to re-read BM25 from disk (used after a rebuild)."""
    _cached_bm25.cache_clear()


def bm25_search(query: str, top_k: int) -> List[Dict]:
    """
    Keyword search against the persisted BM25 index. Returns a list of
    dicts: {source, chunk_id, chunk_index, text, score}, ordered by
    score desc. Returns [] if no index has been built yet.
    """
    loaded = _cached_bm25()
    if loaded is None:
        return []

    bm25, chunks = loaded
    scores = bm25.get_scores(_tokenize(query))

    ranked = sorted(
        zip(chunks, scores),
        key=lambda pair: pair[1],
        reverse=True,
    )[:top_k]

    return [
        {
            "source": chunk["source"],
            "chunk_id": chunk["chunk_id"],
            "chunk_index": chunk["chunk_index"],
            "text": chunk["text"],
            "score": float(score),
        }
        for chunk, score in ranked
        if score > 0
    ]


def bm25_document_count() -> int:
    loaded = _cached_bm25()
    if loaded is None:
        return 0
    return len(loaded[1])
