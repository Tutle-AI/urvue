"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { KiriPageContext } from "@/lib/kiri-context";

type Citation = { conversationId: string; label: string; href: string };
type ChatMessage = { role: "user" | "assistant"; content: string; citations?: Citation[] };

export function KiriChat({
  context,
  initialThreadId = null,
  initialMessages = [],
  compact = false,
}: {
  context: KiriPageContext;
  initialThreadId?: string | null;
  initialMessages?: ChatMessage[];
  compact?: boolean;
}) {
  const [threadId, setThreadId] = useState(initialThreadId);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    setError("");
    setMessages((current) => [...current, { role: "user", content: question }]);
    setLoading(true);
    try {
      const response = await fetch("/api/kiri/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, message: question, context }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Kiri could not answer");
      setThreadId(data.threadId);
      setMessages((current) => [...current, { role: "assistant", content: data.answer, citations: data.citations }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Kiri could not answer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`flex flex-col ${compact ? "h-[min(70svh,620px)]" : "min-h-[65svh]"}`}>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" aria-live="polite">
        {!messages.length && (
          <div className="rounded-2xl bg-primary/10 p-4 text-sm leading-relaxed text-foreground">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-primary">Kiri</span>
            Ask me what customers are praising, what needs attention, or why a pattern is appearing. I’ll show the sample and supporting feedback.
          </div>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "ml-auto bg-primary text-white" : "bg-surface text-foreground"}`}>
            <span className={`mb-1 block text-xs font-medium uppercase tracking-wide ${message.role === "user" ? "text-white/70" : "text-primary"}`}>{message.role === "user" ? "You" : "Kiri"}</span>
            <p className="whitespace-pre-wrap">{message.content}</p>
            {message.citations?.length ? <div className="mt-3 flex flex-wrap gap-2">{message.citations.map((citation) => <Link key={citation.conversationId} href={citation.href} className="rounded-full border border-border bg-card px-3 py-1 text-xs text-primary">Supporting feedback</Link>)}</div> : null}
          </div>
        ))}
        {loading && <div className="w-fit rounded-2xl bg-surface px-4 py-3 text-sm text-muted">Kiri is checking the evidence…</div>}
      </div>
      <form onSubmit={submit} className="border-t border-border p-4">
        <textarea value={input} onChange={(event) => setInput(event.target.value.slice(0, 2_000))} placeholder="Ask Kiri about your customer feedback…" className="min-h-20 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50" />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-xs text-muted">Answers use structured feedback, not guesses.</span>
          <button disabled={!input.trim() || loading} className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">Ask Kiri</button>
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </form>
    </div>
  );
}
