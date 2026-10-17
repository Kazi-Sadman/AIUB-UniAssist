"""
UniAssist AI - full indexing pipeline.

TXT files -> loader -> chunker -> BGE-M3 embeddings -> Qdrant + BM25.

Called from scripts/rebuild_index.py. Never called during a normal
chat request.
"""

from typing import Dict, List

from app.rag.chunker import chunk_documents
from app.rag.config import ensure_data_dirs
from app.rag.embeddings import embed_documents
from app.rag.loader import discover_txt_files, load_documents
from app.rag.sparse import build_bm25, reload_bm25_cache, save_bm25
from app.rag.vector_store import collection_vector_count, ensure_collection, index_chunks


def _chunks_to_dicts(chunk_documents_list) -> List[Dict]:
    return [
        {
            "text": chunk.page_content,
            "source": chunk.metadata["source"],
            "chunk_id": chunk.metadata["chunk_id"],
            "chunk_index": chunk.metadata["chunk_index"],
        }
        for chunk in chunk_documents_list
    ]


def rebuild_index() -> Dict:
    """
    Run the complete index rebuild pipeline and return a summary dict
    for reporting (used by scripts/rebuild_index.py).
    """
    ensure_data_dirs()

    print("Loading documents...")
    txt_files = discover_txt_files()
    print(f"Found {len(txt_files)} TXT files.")

    documents = load_documents()
    print(f"Loaded {len(documents)} documents.")

    if not documents:
        print("No documents found. Add .txt files to backend/data/documents/ and re-run.")
        return {
            "txt_files": len(txt_files),
            "documents": 0,
            "chunks": 0,
            "vectors": 0,
            "bm25_documents": 0,
        }

    print("Creating chunks...")
    chunk_docs = chunk_documents(documents)
    chunks = _chunks_to_dicts(chunk_docs)
    print(f"Created {len(chunks)} chunks.")

    print("Generating embeddings...")
    texts = [chunk["text"] for chunk in chunks]
    vectors = embed_documents(texts)
    print("Embedding completed.")

    print("Updating Qdrant...")
    ensure_collection()
    index_chunks(chunks, vectors)
    print("Qdrant indexing completed.")

    print("Building BM25...")
    bm25, bm25_chunks = build_bm25(chunks)
    save_bm25(bm25, bm25_chunks)
    reload_bm25_cache()
    print("BM25 index saved.")

    print("\nIndex rebuild completed successfully.")

    return {
        "txt_files": len(txt_files),
        "documents": len(documents),
        "chunks": len(chunks),
        "vectors": collection_vector_count(),
        "bm25_documents": len(bm25_chunks),
    }
