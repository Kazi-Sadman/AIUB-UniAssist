"""
UniAssist AI - chunking.

Splits loaded Documents into smaller chunks using LangChain's
RecursiveCharacterTextSplitter, and stamps each chunk with a stable,
human-readable chunk_id (e.g. "AIUB_TUTION_FEES_003") so the same
chunk identity is shared between Qdrant and BM25.

Note: RecursiveCharacterTextSplitter splits on CHARACTERS, not tokens.
CHUNK_SIZE=500 means ~500 characters per chunk, not 500 tokens.
"""

from typing import List

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.rag.config import CHUNK_OVERLAP, CHUNK_SIZE


def _build_splitter() -> RecursiveCharacterTextSplitter:
    return RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        # Prefer splitting on paragraph/line/sentence boundaries before
        # falling back to raw characters, so headings and paragraphs in
        # the policy documents aren't destroyed mid-sentence.
        separators=["\n\n", "\n", ". ", " ", ""],
    )


def chunk_documents(documents: List[Document]) -> List[Document]:
    """
    Split documents into chunks and attach chunk_id / chunk_index metadata.

    Returns a flat list of chunk Documents. Each chunk keeps the parent
    document's "source"/"filename" metadata plus its own chunk_id.
    """
    splitter = _build_splitter()
    all_chunks: List[Document] = []

    for document in documents:
        filename = document.metadata.get("filename", "unknown")
        stem = filename.rsplit(".", 1)[0]

        pieces = splitter.split_text(document.page_content)

        for index, piece in enumerate(pieces, start=1):
            chunk_id = f"{stem}_{index:03d}"
            all_chunks.append(
                Document(
                    page_content=piece,
                    metadata={
                        **document.metadata,
                        "chunk_id": chunk_id,
                        "chunk_index": index,
                    },
                )
            )

    return all_chunks
