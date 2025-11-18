"""
embeddings.py

Host-ready embeddings helper:
- loads SentenceTransformer model once (cached)
- exposes embed_texts(texts: List[str], batch_size: int=64) -> List[List[float]]
- returns Python lists (JSON-serializable) for easy DB insertion

Notes:
- Default model: all-mpnet-base-v2 (768 dims). Change MODEL_NAME via env if needed.
- Keeps memory usage reasonable by batching.
"""

from typing import List
import os
import math

# sentence-transformers
from sentence_transformers import SentenceTransformer
import numpy as np

MODEL_NAME = os.getenv("EMBEDDING_MODEL", "all-mpnet-base-v2")
# batch size controls memory / speed tradeoff
DEFAULT_BATCH_SIZE = int(os.getenv("EMBED_BATCH_SIZE", "64"))

_model: SentenceTransformer | None = None

def get_model() -> SentenceTransformer:
    """Load and cache the SentenceTransformer model."""
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def embed_texts(texts: List[str], batch_size: int = DEFAULT_BATCH_SIZE) -> List[List[float]]:
    """
    Embed a list of texts and return list-of-lists (float).
    - Batches to avoid OOM for large inputs.
    - Always returns Python floats (not numpy types) to be JSON/DB friendly.
    """
    if not texts:
        return []

    model = get_model()
    n = len(texts)
    batches = math.ceil(n / batch_size)
    out_embeddings: List[List[float]] = []

    for i in range(batches):
        start = i * batch_size
        end = min(start + batch_size, n)
        batch_texts = texts[start:end]
        embeddings = model.encode(batch_texts, show_progress_bar=False, convert_to_numpy=True)
        # Convert numpy array rows to python lists of native floats
        for row in embeddings:
            out_embeddings.append([float(x) for x in row.tolist()])

    return out_embeddings


