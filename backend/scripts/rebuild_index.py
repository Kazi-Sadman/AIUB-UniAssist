"""
UniAssist AI - manual index rebuild entry point.

Run this once before first use, and again any time you add or change
a .txt file in backend/data/documents/:

    cd backend
    python scripts/rebuild_index.py

This is the ONLY thing that writes to Qdrant/BM25. Normal chat
requests only ever read the already-built indexes.
"""

import sys
from pathlib import Path

# Allow running as `python scripts/rebuild_index.py` from backend/.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.rag.ingest import rebuild_index  # noqa: E402


def main() -> None:
    summary = rebuild_index()

    print("\nSummary")
    print("-------")
    print(f"TXT files found:   {summary['txt_files']}")
    print(f"Documents loaded:  {summary['documents']}")
    print(f"Chunks created:    {summary['chunks']}")
    print(f"Vectors in Qdrant: {summary['vectors']}")
    print(f"BM25 documents:    {summary['bm25_documents']}")


if __name__ == "__main__":
    main()
