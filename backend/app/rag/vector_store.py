"""
UniAssist AI - Qdrant vector store.

Owns a single reused QdrantClient, creates the collection automatically
if it does not exist, and exposes indexing + dense-retrieval helpers.
"""

import uuid
from functools import lru_cache
from typing import Dict, List

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from qdrant_client.http.exceptions import UnexpectedResponse

from app.rag.config import (
    EMBEDDING_DIMENSION,
    QDRANT_COLLECTION,
    QDRANT_URL,
    QDRANT_API_KEY,
)

@lru_cache(maxsize=1)
def get_qdrant_client() -> QdrantClient:
    return QdrantClient(
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY or None,
    )
def ensure_collection() -> None:
    """Create the collection only if it does not exist."""
    client = get_qdrant_client()

    if not client.collection_exists(
        collection_name=QDRANT_COLLECTION
    ):
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=qmodels.VectorParams(
                size=EMBEDDING_DIMENSION,
                distance=qmodels.Distance.COSINE,
            ),
        )


def _stable_point_id(source: str, chunk_id: str) -> str:
    """Deterministic UUID from source+chunk_id so re-indexing overwrites cleanly."""
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"{source}::{chunk_id}"))


def index_chunks(chunks: List[Dict], vectors: List[List[float]]) -> int:
    """
    Upsert chunk vectors + metadata into Qdrant.

    `chunks` items must contain: text, source, chunk_id, chunk_index.
    Returns the number of points written.
    """
    ensure_collection()
    client = get_qdrant_client()

    points = [
        qmodels.PointStruct(
            id=_stable_point_id(chunk["source"], chunk["chunk_id"]),
            vector=vector,
            payload={
                "text": chunk["text"],
                "source": chunk["source"],
                "filename": chunk["source"],
                "chunk_id": chunk["chunk_id"],
                "chunk_index": chunk["chunk_index"],
            },
        )
        for chunk, vector in zip(chunks, vectors)
    ]

    if points:
        client.upsert(collection_name=QDRANT_COLLECTION, points=points)

    return len(points)


def dense_search(query_vector: List[float], top_k: int) -> List[Dict]:
    """
    Semantic search against Qdrant. Returns a list of dicts:
    {source, chunk_id, chunk_index, text, score}, ordered by score desc.
    """
    client = get_qdrant_client()

    try:
        client.get_collection(QDRANT_COLLECTION)
    except Exception:
        return []

    results = client.query_points(
        collection_name=QDRANT_COLLECTION,
        query=query_vector,
        limit=top_k,
        with_payload=True,
    ).points

    return [
        {
            "source": hit.payload.get("source"),
            "chunk_id": hit.payload.get("chunk_id"),
            "chunk_index": hit.payload.get("chunk_index"),
            "text": hit.payload.get("text"),
            "score": hit.score,
        }
        for hit in results
    ]


def collection_vector_count() -> int:
    """Number of vectors currently stored - used for rebuild_index.py reporting."""
    client = get_qdrant_client()
    try:
        info = client.get_collection(QDRANT_COLLECTION)
        return info.points_count or 0
    except Exception:
        return 0
