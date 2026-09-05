import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { requireOnboardedSpace } from "@/lib/business";
import { getBusinessStats, getRecentSessions, getSpaceInsights } from "@/lib/stats";
import { featureEnabled } from "@/lib/features";

const sections = [
  { type: "GOING_WELL", title: "What’s going well?", empty: "Praise and strengths will appear here as customers talk." },
  { type: "NEEDS_ATTENTION", title: "What needs attention?", empty: "No recurring issues have surfaced yet." },
  { type: "CHANGED", title: "What’s changed?", empty: "UrVue needs more history before comparing periods." },
  { type: "RECOMMENDATION", title: "What should I do?", empty: "Recommendations appear when the evidence supports a next step." },
] as const;

function confidenceLabel(value: number | null) {
  if (value === null) return "Confidence unknown";
  if (value >= 0.8) return "High confidence";
  if (value >= 0.6) return "Moderate confidence";
  return "Early signal";
}

export default async function DashboardPage() {
  if (!featureEnabled("intelligenceDashboard")) notFound();
  const { space } = await requireOnboardedSpace();
  const [stats, insights, recent] = await Promise.all([
    getBusinessStats(space.id),
    getSpaceInsights(space.id),
    getRecentSessions(space.id, 5),
  ]);
  const greeting = new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening";
  const priority = insights.filter((insight) => insight.type === "NEEDS_ATTENTION" || insight.type === "CHANGED").slice(0, 2);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-primary">{space.name}</p>
          <h1 className="mt-1 font-serif text-3xl text-foreground">{greeting}. Here’s what your customers are telling you.</h1>
          <p className="mt-2 text-sm text-muted">Based on {stats.summarizedSessions} analyzed conversation{stats.summarizedSessions === 1 ? "" : "s"}.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/kiri" className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:border-primary">Ask Kiri</Link>
          <Link href="/dashboard/locations" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white">Share feedback</Link>
        </div>
      </div>

      {priority.length > 0 && (
        <section className="rounded-3xl border border-primary/25 bg-primary/10 p-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Kiri’s morning brief</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">{priority.length === 1 ? "One thing is worth a look." : "Two things are worth a look."}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {priority.map((insight) => <Link key={insight.id} href={`/dashboard/insights/${insight.id}`} className="rounded-2xl bg-card p-4 text-sm text-foreground hover:ring-1 hover:ring-primary"><span className="font-medium">{insight.title}</span><span className="mt-1 block text-muted">{insight.observation}</span></Link>)}
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-wide text-muted">Conversations</p><p className="mt-2 text-3xl font-semibold text-foreground">{stats.totalSessions}</p><p className="mt-1 text-xs text-muted">{stats.thisWeekSessions} this week</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-wide text-muted">Analyzed</p><p className="mt-2 text-3xl font-semibold text-foreground">{stats.summarizedSessions}</p><p className="mt-1 text-xs text-muted">{stats.sentimentBreakdown.pending} processing</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-wide text-muted">Positive signals</p><p className="mt-2 text-3xl font-semibold text-foreground">{stats.sentimentBreakdown.positive}</p><p className="mt-1 text-xs text-muted">Conversation-level sentiment</p></div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {sections.map((section) => {
          const items = insights.filter((insight) => insight.type === section.type);
          return (
            <section key={section.type} className="rounded-3xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <div className="mt-4 space-y-3">
                {items.length ? items.map((insight) => (
                  <Link key={insight.id} href={`/dashboard/insights/${insight.id}`} className="block rounded-2xl bg-surface/60 p-4 transition hover:bg-surface">
                    <div className="flex items-start justify-between gap-3"><h3 className="font-medium text-foreground">{insight.title}</h3><span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">{insight.patternStrength.toLowerCase()}</span></div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{insight.observation}</p>
                    {insight.recommendation && <p className="mt-2 text-sm text-foreground">{insight.recommendation}</p>}
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted"><span>Based on {insight.evidenceCount} conversation{insight.evidenceCount === 1 ? "" : "s"}</span><span>·</span><span>{confidenceLabel(insight.confidence)}</span><span className="ml-auto text-primary">View supporting feedback →</span></div>
                  </Link>
                )) : <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">{section.empty}</div>}
              </div>
            </section>
          );
        })}
      </div>

      <section className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-foreground">Recent conversations</h2><Link href="/dashboard/sessions" className="text-sm text-primary">View all</Link></div>
        <div className="mt-4 divide-y divide-border">
          {recent.length ? recent.map((conversation) => (
            <Link key={conversation.id} href={`/dashboard/sessions/${conversation.id}`} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div><span className="font-medium text-foreground">{conversation.customerName || "Anonymous customer"}</span><span className="ml-2 text-muted">via {conversation.feedbackPoint.name}</span></div>
              <span className="shrink-0 text-xs text-muted">{formatDistanceToNow(conversation.createdAt, { addSuffix: true })}</span>
            </Link>
          )) : <p className="py-4 text-sm text-muted">Share your Feedback Point to start listening.</p>}
        </div>
      </section>
    </div>
  );
}
