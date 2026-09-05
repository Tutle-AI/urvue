"use client";

import { useEffect, useRef, useState } from "react";
import { handleChatKeyDown } from "@/lib/chat-keyboard";

type Message = { role: "customer" | "assistant"; content: string };

export function FeedbackChat({
  slug,
  feedbackPointName,
  agentName,
}: {
  slug: string;
  experienceType: string;
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

  useEffect(() => {
    // Some browsers return a Promise from scrolling. It is not an effect cleanup.
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ended]);

  async function startConversation() {
    if (loading) return;
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
    if (!conversationId || !credential || !input.trim() || ended || loading) return;
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
    if (!conversationId || !credential || ended || loading) return;
    if (input.trim()) {
      setError("You have an unsent response. Send it or clear it before finishing.");
      return;
    }
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
        content: data.reply,
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
      <header className={started ? "border-b border-border p-5 md:p-6" : "px-6 pt-8 md:px-10 md:pt-10"}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{feedbackPointName}</h1>
            {started && <p className="mt-1 text-sm text-muted">With {agentName}</p>}
          </div>
          {started && !ended && (
            <button onClick={finishConversation} disabled={loading} className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:opacity-50">
              Finish
            </button>
          )}
        </div>
      </header>

      {!started ? (
        <div className="px-6 pb-8 pt-4 md:px-10 md:pb-10">
          <form onSubmit={(event) => { event.preventDefault(); void startConversation(); }}>
            <p className="max-w-xl text-base leading-7 text-muted">This is a natural conversation, not a survey. {agentName} will listen and ask questions that matter. Please share honestly—your feedback matters and helps shape what we do next.</p>
            <label htmlFor="customer-name" className="mt-7 block text-sm text-muted">Your name (optional)</label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input id="customer-name" autoComplete="given-name" value={customerName} onChange={(event) => setCustomerName(event.target.value.slice(0, 80))} placeholder="e.g., Sam" className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/50" />
              <button type="submit" disabled={loading} className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{loading ? "Starting…" : `Talk to ${agentName}`}</button>
            </div>
          </form>
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-4 md:p-6">
          <div className="flex max-h-[58svh] min-h-[320px] flex-col gap-3 overflow-y-auto rounded-2xl bg-surface/60 p-4" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "assistant" ? "bg-card text-foreground" : "ml-auto bg-primary/15 text-foreground"}`}>
                <span className="mb-1 block text-xs uppercase tracking-wide text-muted">{message.role === "assistant" ? agentName : "You"}</span>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
            {loading && <div className="w-fit rounded-2xl bg-card px-4 py-3 text-sm text-muted">{agentName} is thinking…</div>}
            {ended && <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4"><div className="text-sm font-medium text-foreground">{customerMessageCount ? "Feedback sent" : "Conversation ended"}</div><p className="mt-1 text-sm text-muted">{customerMessageCount ? "The team can now learn from what you shared. You can close this page." : "You can close this page or come back whenever you’re ready."}</p></div>}
            <div ref={bottomRef} />
          </div>
          {!ended && (
            <div className="flex flex-col gap-3">
              <textarea aria-label="Your response" value={input} onChange={(event) => setInput(event.target.value.slice(0, 2_000))} onKeyDown={(event) => handleChatKeyDown(event, () => { void sendMessage(); }, setInput)} placeholder="Share what happened…" className="min-h-24 resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50" />
              <p className="text-xs text-muted">Enter to send · Ctrl+Enter for a new line</p>
              <button onClick={sendMessage} disabled={loading || !input.trim()} className="w-fit rounded-full bg-primary px-5 py-3 text-sm font-medium text-white disabled:opacity-50">Send</button>
            </div>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
