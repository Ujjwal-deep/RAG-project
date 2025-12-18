## Overview

Frontend for the Retrieval Augmented Generation (RAG) project. It ships a marketing-ready landing page, a document upload workflow, and a ChatGPT-style interface that talks to the backend exposed through `NEXT_PUBLIC_BACKEND_URL`.

This build follows the structure described in `/mnt/data/project structure.pdf` (source file provided by the project brief).

## Requirements

- Node.js 18+ and npm
- Environment variable `NEXT_PUBLIC_BACKEND_URL` pointing at the deployed backend (see `.env.example`)
- Backend API with `/upload` (multipart form-field `files`) and `/query` (JSON `{ question: string }`) endpoints

## Getting Started

```bash
cp .env.example .env.local
echo NEXT_PUBLIC_BACKEND_URL="https://my-backend-url" >> .env.local
npm install
npm run dev
```

Open `http://localhost:3000` to view the UI. The upload and chat flows will call whatever backend URL you configured.

> **Seeing “NEXT_PUBLIC_BACKEND_URL is not set”?**  
> Double-check `.env.local` (or your Vercel environment settings), then restart `npm run dev`. Next.js only reads public env vars on boot.

## Deploying on Vercel

1. Push this repo to GitHub/GitLab.
2. Import into Vercel and pick the `rag-frontend` directory.
3. Under **Settings → Environment Variables**, add `NEXT_PUBLIC_BACKEND_URL` with your production backend URL (e.g. `https://my-backend-url`).
4. Trigger a deploy; no filesystem hacks are required since all imports are relative to `@/`.

## Backend reference

The frontend assumes the FastAPI backend that lives in `../backend`. To run it locally:

```bash
cd ../backend
uvicorn app.main:app --reload --port 8000
```

Point `NEXT_PUBLIC_BACKEND_URL` to `http://localhost:8000` while developing. Deploy the backend to your preferred host before pointing Vercel at it.

## Project structure & shadcn conventions

- Components live in `src/components/ui` to match shadcn UI guidelines. This folder already contains `ButtonPrimary` plus the `background-boxes` component from the brief.
- Shared utilities (like `cn`) live in `src/lib`.
- Global styles are in `src/app/globals.css`; Tailwind is already configured for the App Router.
- If you need to scaffold more shadcn components, run `npx shadcn@latest init -d src` and keep the output inside `src/components/ui` so imports stay alias-safe.

## Feature hints

- Landing page uses the animated background boxes and lucide-react icons, with placeholder copy that you can swap later.
- `/upload` implements drag & drop, “Choose files”, selected file list with removal, and POSTs multipart data to `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload`.
- `/chat` mirrors a ChatGPT-like interface, POSTing `{ question }` to `/query`, showing a loading state, and rendering collapsible sources beneath each assistant response.

Feel free to replace the placeholder copy/images as you adapt the experience for production.
