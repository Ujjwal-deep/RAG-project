"""
pipeline.py

Orchestration for the RAG pipeline (host-ready).

Provides two async functions:
- process_document(file_bytes, filename, document_id, chunk_size, overlap)
    -> ingests file, splits into chunks, embeds, and upserts into Supabase.
- answer_query(question, top_k)
    -> embeds question, retrieves top-k similar chunks, returns (answer_text, sources)

This file purposely does NOT call any LLM yet. It returns retrieved context (sources)
so you can wire an LLM of your choice later in the pipeline.
"""

from typing import List, Tuple, Dict, Any, Optional
import asyncio

from .ingest import extract_text
from .splitter import split_text_to_chunks
from .embeddings import embed_texts
from .vectorstore import upsert_embeddings, query_similar


async def process_document(
    file_bytes: bytes,
    filename: str,
    document_id: str,
    chunk_size: int = 1000,
    overlap: int = 200,
) -> Dict[str, Any]:
    """
    Full pipeline for ingesting a single document.

    Steps:
    1) extract raw text from bytes
    2) split into chunks (list of dicts with chunk_id/text)
    3) embed chunk texts
    4) upsert into Supabase table (idempotent by document_id)

    Returns a summary dict: {"document_id": ..., "num_chunks": n, "inserted": x}
    """

    # 1) extract text (IO / CPU bound) -> run in thread
    text = await asyncio.to_thread(extract_text, file_bytes, filename)

    # 2) split into chunks (CPU bound but small) -> run in thread
    chunk_dicts = await asyncio.to_thread(split_text_to_chunks, text, chunk_size, overlap)
    # convert to simple list of chunk texts ordered by chunk_id
    chunks = [c["text"] for c in chunk_dicts]

    # 3) embed chunks (sentence-transformers; can be heavy) -> run in thread
    embeddings = await asyncio.to_thread(embed_texts, chunks)

    # 4) upsert into supabase (network I/O) -> run in thread
    # optional: attach per-chunk metadata (example: filename)
    metadata = [{"filename": filename} for _ in chunks]
    upsert_result = await asyncio.to_thread(
        upsert_embeddings, document_id, chunks, embeddings, metadata, True
    )

    return {
        "document_id": document_id,
        "num_chunks": len(chunks),
        "inserted": upsert_result.get("inserted", None),
        "requested": upsert_result.get("requested", None),
    }


async def answer_query(question: str, top_k: int = 5) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Embed the question, retrieve top_k similar chunks, and return:
      - answer (a placeholder string + concatenated contexts)
      - sources (list of dicts returned from query_similar)
    This function returns retrieved context so you can later call an LLM (server-side).
    """

    # 1) embed the question
    q_emb_list = await asyncio.to_thread(embed_texts, [question])
    if not q_emb_list:
        return "No embedding produced for the query.", []

    q_emb = q_emb_list[0]

    # 2) query supabase for similar chunks
    hits = await asyncio.to_thread(query_similar, q_emb, top_k)

    # 3) build a simple combined context and placeholder answer
    # Combine chunk_texts into a compact context for LLM usage later
    contexts = []
    sources: List[Dict[str, Any]] = []
    for h in hits:
        # expected keys from RPC: id, document_id, chunk_id, chunk_text, score
        chunk_text = h.get("chunk_text") or h.get("text") or ""
        contexts.append(chunk_text)
        sources.append({
            "id": h.get("id"),
            "document_id": h.get("document_id"),
            "chunk_id": h.get("chunk_id"),
            "score": h.get("score"),
            "text": chunk_text[:500]  # truncated preview
        })

    combined_context = "\n\n---\n\n".join(contexts).strip()

    # 4. ⭐⭐⭐ PASTE LLaMA CODE HERE inside the function ⭐⭐⭐
    if combined_context:
        # <------ PASTE STARTS HERE
        import os, requests
        from requests import HTTPError
        
        HF_API_KEY = os.getenv("HF_API_KEY")
        LLAMA_MODEL = os.getenv("HF_INFERENCE_MODEL", "meta-llama/Llama-2-7b-chat-hf")
        HF_TIMEOUT = 120
        
        def _call_hf_sync(prompt: str, model: str = LLAMA_MODEL) -> str:
            """Sync HF inference call. Raises HTTPError on bad responses."""
            if not HF_API_KEY:
                raise RuntimeError("HF_API_KEY missing in environment.")
            url = f"https://api-inference.huggingface.co/models/{model}"
            headers = {"Authorization": f"Bearer {HF_API_KEY}"}
            payload = {
                "inputs": prompt,
                "parameters": {"max_new_tokens": 512, "temperature": 0.2},
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=HF_TIMEOUT)
            # raise for non-200 to allow caller to detect 410 specifically
            resp.raise_for_status()
            data = resp.json()
            # common HF shapes
            if isinstance(data, list) and data and isinstance(data[0], dict) and "generated_text" in data[0]:
                return data[0]["generated_text"].strip()
            if isinstance(data, dict) and "generated_text" in data:
                return data["generated_text"].strip()
            return str(data)
        
        # Where you previously built `prompt` and awaited the HF call, replace with:
        if combined_context:
            prompt = (
                "You are a helpful assistant. Use ONLY the provided context to answer the question.\n\n"
                f"CONTEXT:\n{combined_context}\n\nQUESTION: {question}\n\n"
                "Answer concisely and cite document_id when possible. If you cannot answer from the context, say so."
            )
        
            try:
                # call HF in a thread so async loop stays responsive
                answer = await asyncio.to_thread(_call_hf_sync, prompt)
            except HTTPError as http_err:
                # HF responses like 410 manifest as HTTPError with status_code==410
                status = getattr(http_err.response, "status_code", None)
                # log exact HF response for debugging (uvicorn log will show this)
                try:
                    err_text = http_err.response.text
                except Exception:
                    err_text = str(http_err)
                # If it's a 410 (Gone / gated model), provide a graceful fallback answer
                if status == 410:
                    # Fallback: make a concise summary of the retrieved context (no LLM)
                    # Keep it short so frontend looks good on resume/demo
                    fallback = " / ".join(c.strip().replace("\n", " ")[:200] for c in contexts[:3])
                    answer = (
                        "(LLM unavailable for the requested model; returned context summary instead.)\n\n"
                        f"{fallback}"
                    )
                else:
                    # For other HTTP errors, include some debug info and still fall back
                    answer = f"(LLM HTTP error {status} — falling back to context summary.)\n\n{combined_context[:1200]}"
                # write the HF error to logs so you can inspect later
                import logging
                logging.getLogger("rag-backend").warning("HF HTTPError status=%s resp=%s", status, err_text)
            except Exception as e:
                # generic fallback on any other error
                answer = f"(LLM call failed: {e})\n\nContext:\n{combined_context[:1200]}"
        else:
            answer = "No relevant context found for the query."

    return answer, sources