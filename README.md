# RETRIEVAL AUGMENTED GENERATION (RAG) APPLICATION  
FastAPI · Supabase (pgvector) · Amazon Bedrock (Titan) · Vercel · Render

### OVERVIEW

This project is a full-stack Retrieval Augmented Generation (RAG)
application that allows users to upload documents and ask
natural-language questions grounded strictly in the uploaded content.

The system follows a production-style RAG architecture. Uploaded
documents are split into chunks, converted into vector embeddings, and
stored in a vector database. When a user submits a question, relevant
chunks are retrieved using vector similarity search and passed as
context to a Large Language Model, which generates an answer using only
the retrieved information.

The backend is implemented using FastAPI, while the frontend is built
using modern React tooling and deployed independently.

### HIGH-LEVEL ARCHITECTURE

User  
→ Frontend (Vercel)  
→ FastAPI Backend (Render)  
→ Supabase Vector Database (PostgreSQL + pgvector)  
→ Amazon Bedrock (Titan Text Express)  
→ Answer with source references

### TECH STACK

Backend:

- Python 3

- FastAPI (API framework)

- Uvicorn (ASGI server)

- Supabase (PostgreSQL with pgvector extension)

- Sentence-Transformers (embedding generation)

- Amazon Bedrock  
   Model used: amazon.titan-text-express-v1

- boto3 (AWS SDK)

- python-dotenv (environment variable management)

Frontend:

- React / Next.js (monorepo setup)

- Tailwind CSS

- Vercel (frontend hosting)

Infrastructure and Services:

- Render (backend hosting, free tier)

- Vercel (frontend hosting, free tier)

- Supabase (managed PostgreSQL and vector search)

- AWS IAM (secure Bedrock access)

### HOW RETRIEVAL WORKS

1.  A user uploads a document (PDF or text).

2.  The backend:

    - Extracts raw text

    - Splits it into smaller chunks

    - Generates embeddings for each chunk

    - Stores embeddings in Supabase using pgvector

3.  When a user asks a question:

    - The question is embedded

    - The system retrieves the top 2--3 most similar chunks

    - A prompt is constructed using only those chunks

4.  Amazon Bedrock (Titan Text Express) generates an answer based on the provided context.

5.  The response includes both the generated answer and the source chunks.

The number of retrieved chunks (top-K) is intentionally capped at 2--3
to reduce prompt size, control cost, and improve latency.

API ENDPOINTS

- Health Check  
GET /health

- Upload Document  
    POST /upload

    Form fields:
    - file: document file
    - document_id: unique identifier


- Query  
POST /query  


### RUNNING LOCALLY (RECOMMENDED)

Due to limited compute resources on free hosting tiers, running the
application locally provides the most reliable experience.

Backend setup:

1.  Navigate to the backend directory.

2.  Create and activate a virtual environment.

3.  Install dependencies from requirements.txt.

4.  Create a .env file inside the backend directory with the following variables:

    - SUPABASE_URL

    - SUPABASE_KEY

    - AWS_ACCESS_KEY_ID

    - AWS_SECRET_ACCESS_KEY

    - AWS_REGION (us-east-1)

    - BEDROCK_MODEL_ID (amazon.titan-text-express-v1)

5.  Start the backend using Uvicorn.

Frontend setup:

1.  Navigate to the frontend directory.

2.  Install dependencies.

3.  Set the API URL to the local backend
    > [http://127.0.0.1:8000](http://127.0.0.1:8000).

4.  Start the development server.

### ONLINE DEPLOYMENT STATUS

The application is deployed online, but with important limitations.

Backend (Render -- Free Tier):

- The backend service deploys and starts successfully.

- During actual RAG queries, the service may crash, restart, or timeout.

- This occurs due to insufficient CPU and RAM on Render's free plan when
  handling embedding generation and Amazon Bedrock inference.

- This is an infrastructure limitation rather than a code issue.

Frontend (Vercel):

- The frontend deploys and loads correctly.

- API requests may fail when the backend restarts due to resource limits.

### DEMO VIDEO (LOCAL EXECUTION)

Demo Video for Local Run:
- [RAG Demo video](https://drive.google.com/file/d/1ZzHd2ZZKXDvGF-cqVaHtEsi1l5aOpjk-/view?usp=sharing)

The demo video shows the complete workflow running locally, including
document upload, retrieval, and context-grounded answers without hosting
constraints.

### SECURITY NOTES

- No secrets or credentials are committed to the repository.

- AWS access is scoped using IAM policies.

- Amazon Bedrock access is restricted to a specific model.

- Environment variables are managed via .env files locally and platform-provided secrets in production.

### FUTURE IMPROVEMENTS

- Upgrade backend hosting to a paid tier for stability.

- Add streaming responses from Amazon Bedrock.

- Implement authentication and per-user document isolation.

- Add caching for repeated queries.

- Improve frontend user experience and source highlighting.

### KEY TAKEAWAYS

This project demonstrates:

- End-to-end RAG system design

- Vector search using PostgreSQL with pgvector

- Cloud-based LLM integration using Amazon Bedrock

- Cost-aware retrieval and prompt construction

- Real-world deployment constraints and engineering trade-offs

### AUTHOR

This project was built as a learning and portfolio exercise focused on
modern RAG architectures and cloud-native LLM integration.