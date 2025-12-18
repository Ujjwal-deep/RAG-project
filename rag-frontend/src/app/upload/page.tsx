"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { FileUploader } from "@/components/FileUploader";
import { ButtonPrimary } from "@/components/ui/ButtonPrimary";
import { uploadFiles } from "@/lib/api";

export default function UploadPage() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = React.useState<string>("");
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const isBackendConfigured = Boolean(backendUrl);

  const handleUpload = async () => {
    try {
      setIsSubmitting(true);
      setStatus("idle");
      const response = await uploadFiles(files);
      setFiles([]);
      setStatus("success");
      setMessage(response.message || "Files uploaded successfully.");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600">
            Upload
          </p>
          <h1 className="text-4xl font-semibold leading-tight">Send documents to the backend.</h1>
          <p className="text-slate-500">
            Supports PDF, DOCX, and TXT. Files are posted to the configured backend URL via
            multipart form data.
          </p>
        </header>

        {!isBackendConfigured ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Backend URL missing</p>
            <p>
              Create a `.env.local` file in the `rag-frontend` directory with:
            </p>
            <pre className="mt-2 rounded bg-white p-2 text-xs">
              NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
            </pre>
            <p className="mt-2">
              Then restart the dev server (stop with Ctrl+C and run `npm run dev` again).
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <p className="font-semibold">Backend URL configured</p>
            <p className="text-xs font-mono mt-1">{backendUrl}</p>
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <FileUploader files={files} onChange={setFiles} />
          <div className="mt-6 flex flex-col gap-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
            <span>Tip: keep files under 20MB for faster processing.</span>
            <ButtonPrimary
              onClick={handleUpload}
              disabled={files.length === 0 || isSubmitting || !isBackendConfigured}
              className="w-full md:w-auto"
            >
              {isSubmitting ? "Uploading..." : "Upload files"}
            </ButtonPrimary>
          </div>

          {status === "success" && (
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5" />
                <div>
                  <p className="font-semibold">Upload complete</p>
                  <p className="text-sm">{message}</p>
                </div>
              </div>
              <ButtonPrimary variant="outline" asChild>
                <Link href="/chat">Go to Chat</Link>
              </ButtonPrimary>
            </div>
          )}

          {status === "error" && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900">
              <AlertCircle className="mt-1 h-5 w-5" />
              <div>
                <p className="font-semibold">Upload failed</p>
                <p className="text-sm">{message}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

