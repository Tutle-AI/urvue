"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  role: "customer" | "assistant";
  content: string;
};

type Summary = {
  summary: string;
  sentiment: string;
  score: number | null;
};

export function FeedbackChat({
  slug,
  businessName,
  locationName,
}: {
  slug: string;
  businessName: string;
  locationName: string;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Thanks for visiting ${businessName}! I'm here to capture your experience at ${locationName}. What stood out for you?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, summary]);

  useEffect(() => {
    const startSession = async () => {
      const res = await fetch("/api/feedback/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      if (!res.ok) return;
      const data = await res.json();
      setSessionId(data.sessionId);
    };

    startSession();
  }, [slug]);

  const sendMessage = async () => {
    if (!sessionId || !input.trim()) return;
    const content = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "customer", content }]);
    setLoading(true);

    try {
      const res = await fetch("/api/feedback/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: content }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong—please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const finishConversation = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/feedback/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.summary) {
        setSummary({
          summary: data.summary.summary,
          sentiment: data.summary.sentiment,
          score: data.summary.score,
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass flex w-full max-w-3xl flex-col gap-4 rounded-3xl p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">You are chatting with</p>
          <p className="text-lg font-semibold text-foreground">{businessName}</p>
        </div>
        <button
          onClick={finishConversation}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
          disabled={loading || !sessionId}
        >
          Finish & summarize
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-surface/70 p-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "assistant"
                ? "bg-card text-foreground"
                : "bg-primary/10 text-foreground"
            }`}
          >
            <span className="block text-xs uppercase tracking-wide text-muted">
              {msg.role === "assistant" ? "URVUE" : "You"}
            </span>
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="rounded-2xl bg-card px-4 py-3 text-sm text-muted">
            Thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-col gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell us how your visit went..."
          className="min-h-[90px] resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim() || !sessionId}
            className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
          >
            Send
          </button>
          <span className="text-xs text-muted">
            Responses are generated by AI to keep things quick.
          </span>
        </div>
      </div>

      {summary && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-muted">
              Summary
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              Sentiment: {summary.sentiment.toLowerCase()}
              {summary.score !== null ? ` (${Math.round(summary.score * 100)}%)` : ""}
            </div>
          </div>
          <p className="mt-2 text-sm text-foreground">{summary.summary}</p>
        </div>
      )}
    </div>
  );
}

