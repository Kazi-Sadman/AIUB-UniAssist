"""
UniAssist AI - document loading.

Automatically discovers every *.txt file under backend/data/documents/
and turns it into a LangChain Document. No filenames are hard-coded:
add a new .txt file and it is picked up the next time
`python scripts/rebuild_index.py` runs.
"""

from pathlib import Path
from typing import List

from langchain_core.documents import Document

from app.rag.config import DOCUMENTS_DIR


def discover_txt_files() -> List[Path]:
    """Return every .txt file under DOCUMENTS_DIR, sorted for stable ordering."""
    if not DOCUMENTS_DIR.exists():
        return []
    return sorted(DOCUMENTS_DIR.glob("*.txt"))


def load_documents() -> List[Document]:
    """
    Load every discovered .txt file into a LangChain Document.

    Each Document's metadata carries the source filename so it survives
    chunking and can be returned to the user as a citation later.
    """
    documents: List[Document] = []

    for file_path in discover_txt_files():
        # Encoding fallback: most knowledge-base files are UTF-8, but be
        # defensive in case one was saved as Windows-1252/CP1252.
        try:
            text = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            text = file_path.read_text(encoding="cp1252", errors="replace")

        text = text.strip()
        if not text:
            continue

        documents.append(
            Document(
                page_content=text,
                metadata={
                    "source": file_path.name,
                    "filename": file_path.name,
                },
            )
        )

    return documents
