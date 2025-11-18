"""
splitter.py

Split a long text into overlapping chunks suitable for embedding and storage.

Functions:
- split_text_to_chunks(text, chunk_size=1000, overlap=200) -> List[dict]
    Each dict: {"chunk_id": int, "text": str}
"""

from typing import List, Dict

def split_text_to_chunks(
    text: str,
    chunk_size: int = 1000,
    overlap: int = 200
) -> List[Dict]:
    """
    Split `text` into chunks of approx `chunk_size` characters with `overlap` characters overlap.
    Returns a list of dicts: [{"chunk_id": 0, "text": "..."}, ...]
    Guarantees progress (won't stuck when chunk_size <= overlap).
    """
    if not text:
        return []

    if chunk_size <= 0:
        raise ValueError("chunk_size must be > 0")
    if overlap < 0:
        raise ValueError("overlap must be >= 0")

    chunks: List[Dict] = []
    text_len = len(text)
    start = 0
    chunk_id = 0

    # Effective step ensures progress; if overlap >= chunk_size, step becomes 1
    step = max(chunk_size - overlap, 1)

    while start < text_len:
        end = start + chunk_size
        chunk_text = text[start:end]
        chunks.append({"chunk_id": chunk_id, "text": chunk_text})
        chunk_id += 1
        start += step

    return chunks
