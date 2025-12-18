"use client";

import React from "react";
import { SendHorizontal } from "lucide-react";

import { ChatMessage } from "@/components/ChatMessage";
import { ButtonPrimary } from "@/components/ui/ButtonPrimary";
import { queryQuestion, type Source } from "@/lib/api";

type ChatMessageRecord = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  isLoading?: boolean;
};

export default function ChatPage() {
  const [messages, setMessages] = React.useState<ChatMessageRecord[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const isBackendConfigured = Boolean(backendUrl);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !isBackendConfigured) return;

    const question = input.trim();
    setInput("");

    const userMessage: ChatMessageRecord = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    };
    const placeholder: ChatMessageRecord = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Thinking...",
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, placeholder]);
    setIsLoading(true);

    try {
      const response = await queryQuestion(question);
      replaceAssistantMessage({
        answer: response.answer ?? "I was unable to generate an answer.",
        sources: response.sources,
      });
    } catch (error) {
      replaceAssistantMessage({
        answer:
          error instanceof Error
            ? error.message
            : "The server did not respond. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const replaceAssistantMessage = ({
    answer,
    sources,
  }: {
    answer: string;
    sources?: Source[];
  }) => {
    setMessages((prev) => {
      const next = [...prev];
      const lastIndex = next.findIndex(
        (item, index) => item.role === "assistant" && next.length - 1 === index && item.isLoading,
      );
      if (lastIndex !== -1) {
        next[lastIndex] = {
          ...next[lastIndex],
          content: answer,
          isLoading: false,
          sources,
        };
      }
      return next;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-600">Chat</p>
            <h1 className="text-3xl font-semibold leading-tight">Ask about your docs.</h1>
          </div>
          <p className="text-sm text-slate-500">
            {isLoading ? "Generating answer..." : "Shift + Enter adds a newline"}
          </p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
        {!isBackendConfigured && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Backend URL missing</p>
            <p>
              Add `NEXT_PUBLIC_BACKEND_URL` to `.env.local`, restart the dev server, then refresh
              this page. We disable the send button until it is configured.
            </p>
          </div>
        )}
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4"
        >
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            messages.map((message) => <ChatMessage key={message.id} {...message} />)
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label htmlFor="chat-input" className="sr-only">
            Ask a question
          </label>
          <textarea
            id="chat-input"
            className="min-h-[120px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none"
            placeholder="Ask anything about the documents you've uploaded..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Enter = send • Shift + Enter = newline</span>
            <ButtonPrimary
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || !isBackendConfigured}
              className="px-4 py-2 text-sm"
            >
              {isLoading ? "Sending..." : "Send"}
              <SendHorizontal className="h-4 w-4" />
            </ButtonPrimary>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-slate-500">
      <div className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs uppercase tracking-[0.4em] text-cyan-600">
        Ready
      </div>
      <div className="max-w-md space-y-3">
        <p className="text-2xl font-semibold text-slate-900">
          Start a chat session with your uploaded sources.
        </p>
        <p className="text-slate-400">
          We ground each assistant answer in the most relevant document chunks and cite them
          below every response.
        </p>
      </div>
    </div>
  );
}

