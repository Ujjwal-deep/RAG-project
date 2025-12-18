"use client";

import React from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

import type { Source } from "@/lib/api";
import { cn } from "@/lib/utils";

type SourceListProps = {
  sources: Source[];
};

export function SourceList({ sources }: SourceListProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-2 text-sm font-semibold text-slate-700"
      >
        <span>Sources ({sources.length})</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {sources.map((source) => (
              <li key={`${source.doc_name}-${source.chunk_text}`} className="p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-600">
                  <FileText className="h-4 w-4" />
                  <span>{source.doc_name}</span>
                  {typeof source.score === "number" && (
                    <span className="text-xs text-slate-500">
                      Relevance {(source.score * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
                  {source.chunk_text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

