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
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, summary]);

  const startConversation = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          customerName: customerName.trim() || null,
        }),
      });

      if (!res.ok) return;
      const data = await res.json();
      setSessionId(data.sessionId);
      setStarted(true);
      setMessages([
        {
          role: "assistant",
          content: `${customerName.trim() ? `Nice to meet you, ${customerName.trim()}. ` : ""}Thanks for visiting ${businessName}! What stood out for you at ${locationName}?`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!sessionId || !input.trim() || ended) return;
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
      if (data.summary) {
        setSummary({
          summary: data.summary.summary,
          sentiment: data.summary.sentiment,
          score: data.summary.score,
        });
        setEnded(true);
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
        setEnded(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4 rounded-3xl border border-border bg-card p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">URVUE</p>
          <p className="text-lg font-semibold text-foreground">{businessName}</p>
          <p className="text-sm text-muted">{locationName}</p>
        </div>
        <button
          onClick={finishConversation}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
          disabled={loading || !sessionId || ended}
        >
          Finish & summarize
        </button>
      </div>

      {!started ? (
        <div className="rounded-2xl border border-border bg-surface/60 p-5">
          <h2 className="text-lg font-semibold text-foreground">
            Tell us about your experience
          </h2>
          <p className="mt-2 text-sm text-muted">
            This will take about a minute. You can skip your name if you want.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label className="text-sm text-muted">Your name (optional)</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g., Sam"
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
              />
            </div>
            <button
              type="button"
              onClick={startConversation}
              disabled={loading}
              className="h-[46px] rounded-full bg-primary px-5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
            >
              Start
            </button>
          </div>
          <div className="mt-4 text-xs text-muted">
            Responses are generated by AI to keep things quick.
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-2xl bg-surface/60 p-4">
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
              className="min-h-[90px] resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
        />
        <div className="flex items-center gap-3">
          <button
                type="button"
            onClick={sendMessage}
                disabled={loading || !input.trim() || !sessionId || ended}
            className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
          >
            Send
          </button>
          <span className="text-xs text-muted">
                Quick, conversational feedback. No forms.
          </span>
        </div>
      </div>
        </>
      )}

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

