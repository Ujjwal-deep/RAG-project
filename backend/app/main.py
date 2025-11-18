"""
main.py

FastAPI entrypoint for the RAG backend.

- Loads .env automatically.
- Exposes two endpoints:
  1) POST /upload  -> accepts file (multipart) + document_id form field, calls process_document()
  2) POST /query   -> accepts JSON {"question": "...", "top_k": 5}, calls answer_query()

This is host-ready: uses async endpoints, simple JSON responses, and CORS enabled for local frontend development.
"""

import os
from dotenv import load_dotenv
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import asyncio

# load backend/.env if present
env_path = Path(__file__).resolve().parents[1] / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=str(env_path))
else:
    load_dotenv()

# configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rag-backend")

# import pipeline functions (these are async)
from app.rag.pipeline import process_document, answer_query  # type: ignore

app = FastAPI(title="RAG Backend")

# allow CORS from local frontend during development (adjust origins in production)
origins = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryPayload(BaseModel):
    question: str
    top_k: int = 5


@app.post("/upload")
async def upload_file(file: UploadFile = File(...), document_id: str = Form(...)):
    """
    Upload endpoint:
    - file: multipart file field
    - document_id: a short unique id (string) you choose for this document
    This endpoint reads file bytes and dispatches to process_document.
    """
    try:
        contents = await file.read()
        # run pipeline
        result = await process_document(contents, file.filename, document_id)
        return {"status": "ok", "result": result}
    except Exception as e:
        logger.exception("Error in /upload")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query")
async def query(payload: QueryPayload):
    """
    Query endpoint:
    - payload.question: text question
    - payload.top_k: number of contexts to return
    Returns: {"answer": str, "sources": [...]}
    """
    try:
        answer, sources = await answer_query(payload.question, top_k=payload.top_k)
        return {"answer": answer, "sources": sources}
    except Exception as e:
        logger.exception("Error in /query")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}
