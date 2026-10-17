"""
UniAssist AI - RAG configuration.

Centralizes every environment-driven setting used by the hybrid RAG
pipeline: paths, embedding model, Qdrant, chunking, retrieval, and
OpenRouter. Nothing here touches the existing enrollment system's
config (backend/app/database.py) - this is additive only.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env if present. Does not override variables already
# set in the real process environment.
load_dotenv()

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

# backend/
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

DOCUMENTS_DIR = Path(os.getenv("RAG_DOCUMENTS_DIR", str(BACKEND_DIR / "data" / "documents")))
BM25_DIR = Path(os.getenv("RAG_BM25_DIR", str(BACKEND_DIR / "data" / "bm25")))
BM25_INDEX_PATH = BM25_DIR / "bm25_index.pkl"
BM25_CHUNKS_PATH = BM25_DIR / "chunks.pkl"

# ---------------------------------------------------------------------------
# Embedding model (BGE-M3)
# ---------------------------------------------------------------------------

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3")
MODEL_CACHE_DIR = os.getenv("MODEL_CACHE_DIR", "D:/AI_Models")
# BGE-M3 dense output dimension (fixed by the model itself).
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "1024"))

# ---------------------------------------------------------------------------
# Qdrant
# ---------------------------------------------------------------------------

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "university_documents")

# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "500"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "50"))
# RecursiveCharacterTextSplitter below is CHARACTER based, not token based.
# Documented here and in README.md.

# ---------------------------------------------------------------------------
# Retrieval
# ---------------------------------------------------------------------------

DENSE_TOP_K = int(os.getenv("DENSE_TOP_K", "10"))
BM25_TOP_K = int(os.getenv("BM25_TOP_K", "10"))
RRF_K = int(os.getenv("RRF_K", "60"))
FINAL_TOP_K = int(os.getenv("FINAL_TOP_K", "5"))
ENABLE_RERANKER = os.getenv("ENABLE_RERANKER", "false").strip().lower() == "true"

# ---------------------------------------------------------------------------
# OpenRouter (LLM)
# ---------------------------------------------------------------------------

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

# ---------------------------------------------------------------------------
# Chat API validation
# ---------------------------------------------------------------------------

MAX_QUESTION_LENGTH = int(os.getenv("RAG_MAX_QUESTION_LENGTH", "1000"))


def ensure_data_dirs() -> None:
    """Create the data directories used by the RAG pipeline if missing."""
    DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
    BM25_DIR.mkdir(parents=True, exist_ok=True)
