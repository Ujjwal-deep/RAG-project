"use client";

import React from "react";
import { Bot, User, Loader2 } from "lucide-react";

import type { Source } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SourceList } from "@/components/SourceList";

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
  sources?: Source[];
};

export function ChatMessage({ role, content, isLoading, sources }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-cyan-600">
          <Bot className="h-5 w-5" />
        </div>
      )}
      <div
        className={cn(
          "max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
          isUser
            ? "bg-cyan-100 text-cyan-900"
            : "bg-slate-50 text-slate-900 border border-slate-200",
        )}
      >
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
          {isUser ? (
            <>
              <User className="h-4 w-4" /> You
            </>
          ) : (
            <>
              <Bot className="h-4 w-4 text-cyan-600" /> Assistant
            </>
          )}
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />}
        </div>
        <p className="mt-2 whitespace-pre-line">{content}</p>
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-3">
            <SourceList sources={sources} />
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600">
          <User className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

