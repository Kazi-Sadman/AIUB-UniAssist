"""
UniAssist AI - hybrid retrieval (the core of the RAG system).

This module is intentionally written as plain, readable Python rather
than hidden behind a LangChain chain, so the full retrieval process -
dense search, BM25 search, Reciprocal Rank Fusion, optional rerank -
can be explained step by step (e.g. in a university presentation).

Pipeline:

    query
      +-> dense_search (BGE-M3 + Qdrant)  -> ranked list A
      +-> bm25_search  (BM25)             -> ranked list B
      -> reciprocal_rank_fusion(A, B)     -> single fused ranking
      -> optional reranker
      -> top FINAL_TOP_K chunks
"""

from typing import Dict, List

from app.rag.config import (
    BM25_TOP_K,
   # DENSE_TOP_K,
    #ENABLE_RERANKER,
    FINAL_TOP_K,
    RRF_K,
)
#from app.rag.embeddings import embed_query
#from app.rag.reranker import rerank
from app.rag.sparse import bm25_search
#from app.rag.vector_store import dense_search
#comment dense search for render deployment

def _chunk_key(chunk: Dict) -> str:
    """Stable unique identifier for a chunk, per requirement 14."""
    return f"{chunk['source']}::{chunk['chunk_id']}"


def reciprocal_rank_fusion(
    dense_results: List[Dict],
    sparse_results: List[Dict],
    rrf_k: int = RRF_K,
) -> List[Dict]:
    """
    Combine a dense ranking and a sparse (BM25) ranking into one fused
    ranking using Reciprocal Rank Fusion:

        RRF(chunk) = sum( 1 / (rrf_k + rank) )

    summed across every ranked list the chunk appears in (rank is
    1-indexed). A chunk that shows up in both lists scores higher than
    one that only shows up in one - that's the "hybrid" benefit.
    """
    scores: Dict[str, float] = {}
    chunk_lookup: Dict[str, Dict] = {}

    for ranked_list in (dense_results, sparse_results):
        for rank, chunk in enumerate(ranked_list, start=1):
            key = _chunk_key(chunk)
            scores[key] = scores.get(key, 0.0) + 1.0 / (rrf_k + rank)
            # Keep the first (highest-ranked) copy of the chunk's payload.
            chunk_lookup.setdefault(key, chunk)

    fused = [
        {**chunk_lookup[key], "rrf_score": score}
        for key, score in scores.items()
    ]
    fused.sort(key=lambda c: c["rrf_score"], reverse=True)
    return fused

def retrieve(query: str) -> List[Dict]:
    """
    Run BM25-only retrieval for low-memory deployment.

    The original hybrid retrieval code is preserved below in comments
    so dense retrieval and RRF can be re-enabled later.
    """

    # LOW-MEMORY MODE: BM25-only retrieval
    sparse_results = bm25_search(query, top_k=BM25_TOP_K)

    # ORIGINAL HYBRID RETRIEVAL — PRESERVED FOR LATER
    # query_vector = embed_query(query)
    # dense_results = dense_search(query_vector, top_k=DENSE_TOP_K)
    # fused_candidates = reciprocal_rank_fusion(
    #     dense_results, sparse_results
    # )
    #
    # if ENABLE_RERANKER:
    #     fused_candidates = rerank(query, fused_candidates)
    #
    # return fused_candidates[:FINAL_TOP_K]

    # Return BM25 results directly without loading BGE-M3.
    return sparse_results[:FINAL_TOP_K]



# comment it for render deployment and add new #function for only BM25
#def retrieve(query: str) -> List[Dict]:
    
   # Run the full hybrid retrieval pipeline for a user query and return
   # the final top-K chunks to pass to the LLM.
   # 
    # 1. Dense retrieval: BGE-M3 query embedding -> Qdrant top DENSE_TOP_K
    #query_vector = embed_query(query)
    #dense_results = dense_search(query_vector, top_k=DENSE_TOP_K)

    # 2. Sparse retrieval: BM25 top BM25_TOP_K over the same chunk set
    #sparse_results = bm25_search(query, top_k=BM25_TOP_K)

    # 3. Fuse both rankings with RRF, deduplicated by source+chunk_id
    #fused_candidates = reciprocal_rank_fusion(dense_results, sparse_results)

    # 4. Optional second-stage reranking (identity pass-through when
    #    ENABLE_RERANKER=false)
    #if ENABLE_RERANKER:
       # fused_candidates = rerank(query, fused_candidates)

    # 5. Only the final top-K chunks are ever sent to the LLM.
    #return fused_candidates[:FINAL_TOP_K]

