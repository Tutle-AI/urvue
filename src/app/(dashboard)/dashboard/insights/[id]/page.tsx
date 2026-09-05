import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOnboardedSpace } from "@/lib/business";
import { prisma } from "@/lib/db";

export default async function InsightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { space } = await requireOnboardedSpace();
  const insight = await prisma.insight.findFirst({
    where: { id, spaceId: space.id },
    include: {
      evidence: {
        include: {
          conversation: { select: { customerName: true, createdAt: true, feedbackPoint: { select: { name: true } } } },
        },
        orderBy: { conversation: { createdAt: "desc" } },
      },
    },
  });
  if (!insight) notFound();

  return (
    <div className="space-y-6">
      <div><Link href="/dashboard" className="text-sm text-muted hover:text-primary">← Back to overview</Link><p className="mt-4 text-xs font-medium uppercase tracking-wide text-primary">{insight.type.replaceAll("_", " ")}</p><h1 className="mt-2 font-serif text-4xl text-foreground">{insight.title}</h1><p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted">{insight.observation}</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted">Evidence</p><p className="mt-1 text-2xl font-semibold text-foreground">{insight.evidenceCount}</p><p className="text-xs text-muted">distinct conversations</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted">Pattern</p><p className="mt-1 text-2xl font-semibold capitalize text-foreground">{insight.patternStrength.toLowerCase()}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted">Confidence</p><p className="mt-1 text-2xl font-semibold text-foreground">{insight.confidence === null ? "Unknown" : `${Math.round(insight.confidence * 100)}%`}</p></div>
      </div>
      {insight.recommendation && <section className="rounded-2xl border border-primary/25 bg-primary/10 p-5"><p className="text-xs font-medium uppercase tracking-wide text-primary">Worth considering</p><p className="mt-2 text-foreground">{insight.recommendation}</p></section>}
      <section className="rounded-3xl border border-border bg-card p-5"><h2 className="text-lg font-semibold text-foreground">Supporting feedback</h2><p className="mt-1 text-sm text-muted">Open any conversation to inspect the complete transcript and extracted findings.</p><div className="mt-4 divide-y divide-border">{insight.evidence.map((evidence) => <Link key={evidence.id} href={`/dashboard/sessions/${evidence.conversationId}`} className="block py-4"><div className="flex items-center justify-between gap-4"><span className="font-medium text-foreground">{evidence.conversation.customerName || "Anonymous customer"}</span><span className="text-xs text-muted">{evidence.conversation.feedbackPoint.name}</span></div>{evidence.excerpt && <blockquote className="mt-2 border-l-2 border-primary pl-3 text-sm text-muted">“{evidence.excerpt}”</blockquote>}<span className="mt-2 block text-xs text-primary">View conversation →</span></Link>)}</div></section>
    </div>
  );
}
