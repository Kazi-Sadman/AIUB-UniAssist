"""
UniAssist AI - embedding service.

Loads BAAI/bge-m3 exactly once per process (module-level singleton) and
reuses it for both indexing and query-time embedding. Never instantiate
HuggingFaceEmbeddings directly elsewhere - always go through
get_embedding_model().
"""

from functools import lru_cache
from typing import List

from langchain_huggingface import HuggingFaceEmbeddings

from app.rag.config import EMBEDDING_MODEL, MODEL_CACHE_DIR


@lru_cache(maxsize=1)
def get_embedding_model() -> HuggingFaceEmbeddings:
    """
    Return the process-wide BGE-M3 embedding model.

    lru_cache(maxsize=1) guarantees the (relatively expensive) model
    load happens once, on first use, and every subsequent call reuses
    the same in-memory model - not per request.
    """
    return HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        cache_folder=MODEL_CACHE_DIR,
        # BGE-M3 recommends normalized embeddings for cosine similarity.
        encode_kwargs={"normalize_embeddings": True},
    )


def embed_documents(texts: List[str]) -> List[List[float]]:
    """Embed a batch of chunk texts for indexing."""
    return get_embedding_model().embed_documents(texts)


def embed_query(text: str) -> List[float]:
    """Embed a single user query at chat time."""
    return get_embedding_model().embed_query(text)
