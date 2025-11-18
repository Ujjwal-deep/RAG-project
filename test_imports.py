import importlib

REQUIRED_MODULES = [
    # Core backend
    "fastapi",
    "uvicorn",

    # RAG + LangChain
    "langchain",
    "langchain_community",
    "langchain_core",

    # Embeddings
    "sentence_transformers",

    # Supabase + pgvector
    "supabase",
    "pgvector",

    # File handling
    "pypdf",
    "docx",            # <-- FIXED
    "pdfplumber",

    # Utils
    "dotenv",
    "tqdm",
    "numpy",

    # Optional
    # "openai",           # remove if not using
    # "huggingface_hub",
]

def check_modules():
    print("\n=== Import Check Results ===\n")
    for module in REQUIRED_MODULES:
        try:
            importlib.import_module(module)
            print(f"✅ {module} — OK")
        except ImportError:
            print(f"❌ {module} — MISSING")
    print("\nCheck complete.\n")

if __name__ == "__main__":
    check_modules()
