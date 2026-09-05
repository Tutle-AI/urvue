"use client";

import { useEffect, useRef, useState } from "react";

type Message = { role: "customer" | "assistant"; content: string };

export function FeedbackChat({
  slug,
  spaceName,
  feedbackPointName,
  agentName,
}: {
  slug: string;
  spaceName: string;
  feedbackPointName: string;
  agentName: string;
}) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [credential, setCredential] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const customerMessageCount = messages.filter((message) => message.role === "customer").length;

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, ended]);

  async function startConversation() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/public/feedback-points/${encodeURIComponent(slug)}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName: customerName.trim() || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to start the conversation");
      setConversationId(data.conversationId);
      setCredential(data.credential);
      setMessages([{ role: "assistant", content: data.greeting }]);
      setStarted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start the conversation");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!conversationId || !credential || !input.trim() || ended) return;
    const content = input.trim();
    setInput("");
    setError("");
    setMessages((current) => [...current, { role: "customer", content }]);
    setLoading(true);
    try {
      const response = await fetch(`/api/public/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${credential}` },
        body: JSON.stringify({ message: content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to send your response");
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
      if (data.finalize) setEnded(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function finishConversation() {
    if (!conversationId || !credential || !customerMessageCount || ended) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/public/conversations/${conversationId}/close`, {
        method: "POST",
        headers: { Authorization: `Bearer ${credential}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to finish the conversation");
      setMessages((current) => [...current, {
        role: "assistant",
        content: "Thank you. Your feedback is on its way to the team, and UrVue is turning it into useful intelligence now.",
      }]);
      setEnded(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to finish the conversation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
      <header className="border-b border-border bg-surface/70 p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">A conversation with {agentName}</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">{spaceName}</h1>
            <p className="mt-1 text-sm text-muted">{feedbackPointName}</p>
          </div>
          {started && !ended && (
            <button onClick={finishConversation} disabled={loading || !customerMessageCount} className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:opacity-50">
              Finish
            </button>
          )}
        </div>
      </header>

      {!started ? (
        <div className="p-5 md:p-6">
          <div className="rounded-2xl border border-border bg-surface/60 p-5">
            <h2 className="text-xl font-semibold text-foreground">Tell us how it really went</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">This is a short, natural conversation—not a survey. {agentName} will listen and ask about the details that matter.</p>
            <label className="mt-5 block text-sm text-muted">Your name (optional)</label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input value={customerName} onChange={(event) => setCustomerName(event.target.value.slice(0, 80))} placeholder="e.g., Sam" className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/50" />
              <button onClick={startConversation} disabled={loading} className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{loading ? "Starting…" : `Talk to ${agentName}`}</button>
            </div>
          </div>
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-4 md:p-6">
          <div className="flex max-h-[58svh] min-h-[320px] flex-col gap-3 overflow-y-auto rounded-2xl bg-surface/60 p-4" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "assistant" ? "bg-card text-foreground" : "ml-auto bg-primary/15 text-foreground"}`}>
                <span className="mb-1 block text-xs uppercase tracking-wide text-muted">{message.role === "assistant" ? agentName : "You"}</span>
                {message.content}
              </div>
            ))}
            {loading && <div className="w-fit rounded-2xl bg-card px-4 py-3 text-sm text-muted">{agentName} is thinking…</div>}
            {ended && <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4"><div className="text-sm font-medium text-foreground">Feedback sent</div><p className="mt-1 text-sm text-muted">The team can now learn from what you shared.</p></div>}
            <div ref={bottomRef} />
          </div>
          {!ended && (
            <div className="flex flex-col gap-3">
              <textarea value={input} onChange={(event) => setInput(event.target.value.slice(0, 2_000))} onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void sendMessage(); }} placeholder="Share what happened…" className="min-h-24 resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50" />
              <button onClick={sendMessage} disabled={loading || !input.trim()} className="w-fit rounded-full bg-primary px-5 py-3 text-sm font-medium text-white disabled:opacity-50">Send</button>
            </div>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
