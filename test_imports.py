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
    "docx",
    "pdfplumber",

    # Utils
    "dotenv",
    "tqdm",
    "numpy",

    # Optional (comment out if not using)
    "openai",
    "huggingface_hub",
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
