"""
ingest.py

Extract raw text from PDF, DOCX, and TXT files.
This is step 1 of the RAG pipeline.
"""

import io
import pdfplumber
import docx

def extract_text(file_bytes: bytes, filename: str) -> str:
    """
    Takes raw bytes from an uploaded file and returns plain text.
    Supports: PDF, DOCX, TXT.
    """

    lower = filename.lower()

    if lower.endswith(".pdf"):
        return extract_pdf(file_bytes)

    if lower.endswith(".docx"):
        return extract_docx(file_bytes)

    if lower.endswith(".txt"):
        return file_bytes.decode(errors="ignore")

    # fallback for unknown types — try decoding directly
    return file_bytes.decode(errors="ignore")


def extract_pdf(file_bytes: bytes) -> str:
    """Reads a PDF file and extracts text using pdfplumber."""
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text_parts.append(page.extract_text() or "")
    return "\n".join(text_parts)


def extract_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file."""
    document = docx.Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in document.paragraphs)
