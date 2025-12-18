import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Boxes } from "@/components/ui/background-boxes";
import { ButtonPrimary } from "@/components/ui/ButtonPrimary";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto flex max-w-4xl flex-col gap-16 px-6 pb-16 pt-20 md:px-10">
        <Hero />
        <section className="space-y-6 rounded-3xl border border-white/5 bg-white/5 p-8 text-slate-100 backdrop-blur">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <ol className="space-y-4 text-slate-300">
            <li>
              <span className="font-semibold text-white">1. Upload</span> — add PDFs, DOCX, or TXT
              files on the upload page.
            </li>
            <li>
              <span className="font-semibold text-white">2. Process</span> — your backend ingests
              the files and updates embeddings.
            </li>
            <li>
              <span className="font-semibold text-white">3. Ask</span> — switch to chat and start
              asking follow-up questions with citations.
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900 px-6 py-16">
      <Boxes className="opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-transparent to-slate-950" />
      <div className="relative z-10 space-y-6">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">RAG System</p>
        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
          Ask questions about your documents with AI-powered search.
        </h1>
        <p className="text-slate-300">
          Upload your PDFs, DOCX, or text files and get instant answers with source citations. 
          Powered by retrieval-augmented generation for accurate, contextual responses.
        </p>
        <div className="flex flex-wrap gap-4">
          <ButtonPrimary asChild>
            <Link href="/upload">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </ButtonPrimary>
          <ButtonPrimary variant="ghost" asChild>
            <Link href="/chat">Go to Chat</Link>
          </ButtonPrimary>
        </div>
      </div>
    </section>
  );
}
