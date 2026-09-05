import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOnboardedSpace } from "@/lib/business";

const findingTitles: Record<string, string> = {
  TOPIC: "Topics",
  PRAISE: "Praise",
  COMPLAINT: "Complaints",
  COMPLIMENT: "Compliments",
  SUGGESTION: "Suggestions",
  ACTIONABLE_ISSUE: "Actionable issues",
};

export default async function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { space } = await requireOnboardedSpace();
  const conversation = await prisma.conversation.findFirst({
    where: { id, feedbackPoint: { spaceId: space.id } },
    include: {
      feedbackPoint: true,
      messages: { orderBy: { createdAt: "asc" } },
      analysis: { include: { findings: { include: { evidenceMessage: true, entityMentions: { include: { entity: true } } } } } },
      legacySummary: true,
    },
  });
  if (!conversation) notFound();
  const analysis = conversation.analysis;
  const groups = analysis?.findings.reduce<Record<string, typeof analysis.findings>>((current, finding) => {
    (current[finding.kind] ||= []).push(finding);
    return current;
  }, {}) || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><Link href="/dashboard/sessions" className="text-sm text-muted hover:text-primary">← Back to conversations</Link><h1 className="mt-3 font-serif text-4xl text-foreground">{conversation.customerName || "Anonymous customer"}</h1><p className="mt-1 text-sm text-muted">{conversation.feedbackPoint.name} · {conversation.createdAt.toLocaleString()}</p></div>
        <div className="flex gap-2"><span className="rounded-full bg-surface px-3 py-1 text-xs text-muted">{conversation.status.toLowerCase()}</span><span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">Analysis {conversation.analysisStatus.toLowerCase()}</span></div>
      </div>

      <section className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-wide text-primary">Conversation intelligence</p><h2 className="mt-1 text-lg font-semibold text-foreground">What UrVue understood</h2></div>{analysis?.confidence !== null && analysis?.confidence !== undefined && <span className="rounded-full bg-surface px-3 py-1 text-xs text-muted">{Math.round(analysis.confidence * 100)}% confidence</span>}</div>
        <p className="mt-4 leading-relaxed text-foreground">{analysis?.summary || conversation.legacySummary?.summary || "Analysis is queued. The raw conversation is safely stored."}</p>
        {analysis && <div className="mt-4 grid gap-3 sm:grid-cols-4"><div className="rounded-xl bg-surface/60 p-3"><p className="text-xs text-muted">Sentiment</p><p className="mt-1 font-medium capitalize text-foreground">{analysis.sentiment.toLowerCase()}</p></div><div className="rounded-xl bg-surface/60 p-3"><p className="text-xs text-muted">Severity</p><p className="mt-1 font-medium capitalize text-foreground">{analysis.severity.toLowerCase()}</p></div><div className="rounded-xl bg-surface/60 p-3"><p className="text-xs text-muted">Satisfaction</p><p className="mt-1 font-medium text-foreground">{analysis.satisfaction ? `${analysis.satisfaction}/5` : "Unknown"}</p></div><div className="rounded-xl bg-surface/60 p-3"><p className="text-xs text-muted">Return intent</p><p className="mt-1 font-medium capitalize text-foreground">{analysis.returnIntent.toLowerCase()}</p></div></div>}
      </section>

      {Object.entries(groups).length > 0 && <div className="grid gap-4 lg:grid-cols-2">{Object.entries(groups).map(([kind, findings]) => <section key={kind} className="rounded-2xl border border-border bg-card p-5"><h2 className="font-medium text-foreground">{findingTitles[kind] || kind}</h2><div className="mt-3 space-y-3">{findings.map((finding) => <div key={finding.id} className="rounded-xl bg-surface/60 p-4"><div className="flex items-start justify-between gap-3"><span className="text-sm font-medium text-foreground">{finding.label}</span>{finding.confidence !== null && <span className="text-xs text-muted">{Math.round(finding.confidence * 100)}%</span>}</div>{finding.detail && <p className="mt-1 text-sm text-muted">{finding.detail}</p>}{finding.evidenceMessage && <blockquote className="mt-2 border-l-2 border-primary pl-3 text-xs text-muted">“{finding.evidenceMessage.content}”</blockquote>}{finding.entityMentions.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{finding.entityMentions.map((mention) => <span key={mention.id} className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">{mention.entity.name}</span>)}</div>}</div>)}</div></section>)}</div>}

      <section className="rounded-3xl border border-border bg-card p-5"><h2 className="text-lg font-semibold text-foreground">Raw conversation</h2><p className="mt-1 text-xs text-muted">Stored separately from the structured intelligence above.</p><div className="mt-4 space-y-3">{conversation.messages.map((message) => <div key={message.id} className={`rounded-2xl px-4 py-3 ${message.role === "ASSISTANT" ? "mr-8 bg-surface" : "ml-8 bg-primary/10"}`}><span className="text-xs uppercase tracking-wide text-muted">{message.role === "ASSISTANT" ? "UrVue agent" : "Customer"}</span><p className="mt-1 text-sm leading-relaxed text-foreground">{message.content}</p></div>)}</div></section>
    </div>
  );
}
