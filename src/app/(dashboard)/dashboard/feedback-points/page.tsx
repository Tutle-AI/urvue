import Link from "next/link";
import { requireOnboardedSpace } from "@/lib/business";
import { prisma } from "@/lib/db";
import { pointBrief, pointLimit } from "@/lib/feedback-point";
import { PointCard } from "./point-card";

export default async function FeedbackPointsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { account, space, membership } = await requireOnboardedSpace();
  const [points, count, query] = await Promise.all([
    prisma.feedbackPoint.findMany({ where: { spaceId: space.id }, include: { _count: { select: { conversations: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.feedbackPoint.count({ where: { space: { accountId: account.id } } }),
    searchParams,
  ]);
  const limit = pointLimit(account.plan);
  const canEdit = membership.role !== "MEMBER";
  const canCreate = canEdit && count < limit;
  const saved = points.find((point) => point.id === query.saved);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.urvue.app";
  return (
    <div className="space-y-7 pb-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Different experiences. Thoughtful conversations.</p><h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">Feedback Points</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">A dedicated listener for every part of your world. Give each point its own context, goals, and personality.</p></div>
        {canCreate && <Link href="/dashboard/feedback-points/new" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white transition hover:brightness-110"><span className="text-lg leading-none">+</span> Create feedback point</Link>}
      </div>
      {saved && <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#a4b696]/25 bg-[#a4b696]/10 px-5 py-4"><p className="text-sm text-[#c6d5bb]">✓ <strong>{saved.name}</strong> is saved. Your agent’s brief is ready.</p><a href={`${baseUrl.replace(/\/$/, "")}/feedback/${saved.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[#c6d5bb]">Open feedback page ↗</a></div>}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface/40 px-5 py-4"><div className="flex items-center gap-4"><div className="flex gap-1.5" aria-hidden="true">{Array.from({ length: limit }, (_, i) => <span key={i} className={`h-6 w-2 rounded-full ${i < count ? "bg-primary" : "bg-border"}`} />)}</div><div><p className="text-sm"><span className="font-medium">{count} of {limit}</span> <span className="text-muted">points in your account</span></p><p className="mt-0.5 text-[11px] text-muted">{account.plan === "STARTER" ? "Basic · $24.99 / month" : "Pro plan"}</p></div></div><p className="text-xs text-muted">{count >= limit ? "All points in use. Fine-tune any point below." : "Each point has its own agent. Kiri brings the insights together."}</p></div>
      <div className="grid items-start gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {points.map((point) => <PointCard key={point.id} point={{ ...pointBrief(point), id: point.id, slug: point.slug, active: point.active, conversationCount: point._count.conversations }} baseUrl={baseUrl} canEdit={canEdit} />)}
        {canCreate && <Link href="/dashboard/feedback-points/new" className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-muted/30 bg-surface/20 p-8 text-center transition hover:border-primary/60 hover:bg-primary/5"><span className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-2xl text-primary">+</span><h2 className="mt-5 font-serif text-2xl">{points.length ? "Another experience to understand?" : "Start with one experience."}</h2><p className="mt-3 max-w-xs text-xs leading-relaxed text-muted">Your website. Your shop. Your latest game.<br />Create a point and give people room to tell you more.</p><span className="mt-6 text-xs font-medium text-primary">Create {points.length ? "a" : "your first"} feedback point →</span></Link>}
      </div>
      <div className="flex items-start gap-4 rounded-2xl bg-[#a4b696]/5 px-5 py-5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#a4b696]/10 font-serif text-lg text-[#b8c8ab]">K</span><div><p className="text-sm font-medium">Every conversation becomes something you can learn from.</p><p className="mt-1 text-xs leading-relaxed text-muted">Your agents listen. UrVue turns the stories into patterns, praise, and things to improve. Ask Kiri to help you make sense of it all.</p></div></div>
    </div>
  );
}
