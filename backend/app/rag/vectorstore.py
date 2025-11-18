"""
vectorstore.py (robust)

Supabase-backed vector store helpers (host-ready).

This version is robust to variations in the supabase-py response object shape.
It implements:
- upsert_embeddings(document_id, chunks, embeddings, metadata=None)
    * idempotent for a given document_id (removes old rows for that document)
    * batch inserts rows
- query_similar(query_embedding, top_k=5)
    * uses the match_vectors RPC created in your DB
"""

# ================================
# Load environment variables (.env)
# ================================
import os
from dotenv import load_dotenv
from pathlib import Path
from typing import List, Dict, Any, Optional

# Try loading backend/.env first
env_path = Path(__file__).resolve().parents[2] / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=str(env_path))
else:
    load_dotenv()

# ================================
# Imports and config
# ================================
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BATCH_SIZE = int(os.getenv("SUPABASE_BATCH_SIZE", "500"))

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL or SUPABASE_KEY environment variables are required.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# -----------------------------
# Helpers for robust response handling
# -----------------------------
def _resp_has_error(resp: Any) -> Optional[str]:
    """
    Check a supabase API response object for an error message in a robust way.
    Returns error string if found, otherwise None.
    """
    # Common attribute (older versions)
    if hasattr(resp, "error"):
        err = getattr(resp, "error")
        if err:
            return str(err)
        return None

    # Some versions expose status_code / or http_status_code
    status_code = getattr(resp, "status_code", None) or getattr(resp, "http_status", None)
    if status_code is not None:
        try:
            sc = int(status_code)
            if sc >= 400:
                # try to stringify body
                if hasattr(resp, "json"):
                    try:
                        return str(resp.json())
                    except Exception:
                        pass
                return f"status_code={sc}"
        except Exception:
            pass

    # Some versions include an 'error' key in data or raw_response
    if hasattr(resp, "data") and isinstance(getattr(resp, "data"), dict):
        data = getattr(resp, "data")
        if "error" in data and data["error"]:
            return str(data["error"])

    # Fallback: no recognized error
    return None


def _resp_get_data_list(resp: Any) -> Optional[List]:
    """
    Try to extract the data (list) from the response in a robust way.
    """
    if hasattr(resp, "data"):
        return getattr(resp, "data")
    # some clients return a dict-like result from .json()
    if hasattr(resp, "json"):
        try:
            j = resp.json()
            # j may be a dict with 'data' key
            if isinstance(j, dict) and "data" in j:
                return j["data"]
            # or it may be a list
            if isinstance(j, list):
                return j
        except Exception:
            pass
    # sometimes raw_response exists
    if hasattr(resp, "raw_response"):
        try:
            raw = getattr(resp, "raw_response")
            if isinstance(raw, dict) and "data" in raw:
                return raw["data"]
        except Exception:
            pass
    return None


# -----------------------------
# INTERNAL: chunked iterable
# -----------------------------
def _chunks_iterable(iterable, size: int):
    for i in range(0, len(iterable), size):
        yield iterable[i : i + size]


# -----------------------------
# upsert_embeddings
# -----------------------------
def upsert_embeddings(
    document_id: str,
    chunks: List[str],
    embeddings: List[List[float]],
    metadata: Optional[List[Dict[str, Any]]] = None,
    delete_existing: bool = True,
) -> Dict[str, Any]:
    """
    Idempotently store embeddings for a document.

    Steps:
    1) Optionally delete existing rows for this document_id (makes operation idempotent).
    2) Insert rows in batches. Each row has: document_id, chunk_id, chunk_text, embedding, metadata.
    """
    if len(chunks) != len(embeddings):
        raise ValueError("chunks and embeddings must have the same length")
    n = len(chunks)
    if metadata is None:
        metadata = [{} for _ in range(n)]
    if len(metadata) != n:
        raise ValueError("metadata length must match chunks length")

    # Delete existing rows for this document (idempotency)
    if delete_existing:
        resp = supabase.table("embeddings").delete().eq("document_id", document_id).execute()
        err = _resp_has_error(resp)
        if err:
            raise RuntimeError(f"Failed to delete existing embeddings for document {document_id}: {err}")

    # Prepare rows
    rows = []
    for i, (chunk_text, emb, meta) in enumerate(zip(chunks, embeddings, metadata)):
        emb_list = [float(x) for x in emb]  # ensure native floats
        rows.append(
            {
                "document_id": document_id,
                "chunk_id": i,
                "chunk_text": chunk_text,
                "embedding": emb_list,
                "metadata": meta or {},
            }
        )

    # Batch insert
    inserted = 0
    for batch in _chunks_iterable(rows, BATCH_SIZE):
        resp = supabase.table("embeddings").insert(batch).execute()
        err = _resp_has_error(resp)
        if err:
            # include some context if possible
            data_snippet = _resp_get_data_list(resp)
            raise RuntimeError(f"Failed to insert batch into Supabase: {err} | data={data_snippet}")

        data = _resp_get_data_list(resp)
        if isinstance(data, list):
            inserted += len(data)
        else:
            # fallback: assume batch length
            inserted += len(batch)

    return {"document_id": document_id, "inserted": inserted, "requested": n}


# -----------------------------
# query_similar
# -----------------------------
def query_similar(query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Query the DB for the top_k most similar chunks using the `match_vectors` RPC.

    Returns:
        list of dicts: each dict contains keys returned by the RPC (id, document_id, chunk_id, chunk_text, score)
    """
    q_emb = [float(x) for x in query_embedding]

    resp = supabase.rpc("match_vectors", {"query_embedding": q_emb, "match_count": top_k}).execute()
    err = _resp_has_error(resp)
    if err:
        raise RuntimeError(f"Supabase RPC match_vectors error: {err}")

    data = _resp_get_data_list(resp)
    if data is None:
        # If nothing found, return empty list
        return []
    return data
