import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { requireOnboardedBusiness } from "@/lib/business";
import {
  getBusinessStats,
  getSentimentTrend,
  getLocationStats,
  getRecentSessions,
} from "@/lib/stats";
import { SentimentChart } from "./sentiment-chart";
import { TrendChart } from "./trend-chart";

function MetricCard({
  label,
  value,
  subtext,
  trend,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-foreground">{value}</span>
        {trend && (
          <span
            className={`text-sm font-medium ${
              trend.positive ? "text-green-500" : "text-red-400"
            }`}
          >
            {trend.positive ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>
      {subtext && <div className="mt-1 text-xs text-muted">{subtext}</div>}
    </div>
  );
}

function sentimentColor(sentiment: string | null | undefined) {
  const s = (sentiment || "").toUpperCase();
  if (s === "POSITIVE") return "bg-green-500/20 text-green-400";
  if (s === "NEGATIVE") return "bg-red-500/20 text-red-400";
  if (s === "NEUTRAL") return "bg-yellow-500/20 text-yellow-400";
  return "bg-foreground/10 text-muted";
}

function sentimentLabel(sentiment: string | null | undefined) {
  return sentiment || "PENDING";
}

export default async function DashboardPage() {
  const { business } = await requireOnboardedBusiness();

  const [stats, trend, locationStats, recentSessions] = await Promise.all([
    getBusinessStats(business.id),
    getSentimentTrend(business.id, 30),
    getLocationStats(business.id),
    getRecentSessions(business.id, 5),
  ]);

  const positivePercent =
    stats.summarizedSessions > 0
      ? Math.round((stats.sentimentBreakdown.positive / stats.summarizedSessions) * 100)
      : 0;

  const weekOverWeekChange =
    stats.lastWeekSessions > 0
      ? Math.round(
          ((stats.thisWeekSessions - stats.lastWeekSessions) / stats.lastWeekSessions) * 100
        )
      : stats.thisWeekSessions > 0
      ? 100
      : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          {business.name}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Your feedback insights at a glance
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Sessions"
          value={stats.totalSessions}
          subtext={`${stats.activeSessions} active`}
        />
        <MetricCard
          label="This Week"
          value={stats.thisWeekSessions}
          trend={
            weekOverWeekChange !== 0
              ? { value: Math.abs(weekOverWeekChange), positive: weekOverWeekChange > 0 }
              : undefined
          }
          subtext="vs last week"
        />
        <MetricCard
          label="Positive Feedback"
          value={`${positivePercent}%`}
          subtext={`${stats.sentimentBreakdown.positive} of ${stats.summarizedSessions} summarized`}
        />
        <MetricCard
          label="Avg Confidence"
          value={stats.avgScore !== null ? `${Math.round(stats.avgScore * 100)}%` : "—"}
          subtext="AI sentiment confidence"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sentiment breakdown */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium text-foreground">Sentiment Breakdown</h2>
          <p className="mt-1 text-xs text-muted">
            Distribution of customer feedback
          </p>
          <div className="mt-4">
            <SentimentChart
              data={[
                { name: "Positive", value: stats.sentimentBreakdown.positive },
                { name: "Neutral", value: stats.sentimentBreakdown.neutral },
                { name: "Negative", value: stats.sentimentBreakdown.negative },
                { name: "Pending", value: stats.sentimentBreakdown.pending },
              ]}
            />
          </div>
        </div>

        {/* Trend chart */}
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="text-sm font-medium text-foreground">Feedback Trend</h2>
          <p className="mt-1 text-xs text-muted">Last 30 days by sentiment</p>
          <div className="mt-4">
            <TrendChart data={trend} />
          </div>
        </div>
      </div>

      {/* Bottom row: Recent sessions + Top locations */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent sessions */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-foreground">Recent Sessions</h2>
              <p className="mt-1 text-xs text-muted">Latest customer feedback</p>
            </div>
            <Link
              href="/dashboard/sessions"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentSessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted">
                No sessions yet. Share your feedback link to get started.
              </div>
            ) : (
              recentSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/dashboard/sessions/${session.id}`}
                  className="flex items-center justify-between rounded-xl bg-surface/60 px-4 py-3 transition hover:bg-surface"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {session.customerName || "Guest"}
                    </div>
                    <div className="mt-0.5 text-xs text-muted">
                      {session.location.name} •{" "}
                      {formatDistanceToNow(session.createdAt, { addSuffix: true })}
                    </div>
                  </div>
                  <span
                    className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium uppercase ${sentimentColor(
                      session.summary?.sentiment
                    )}`}
                  >
                    {sentimentLabel(session.summary?.sentiment)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Top locations */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-foreground">Locations</h2>
              <p className="mt-1 text-xs text-muted">Sessions by location</p>
            </div>
            <Link
              href="/dashboard/locations"
              className="text-xs font-medium text-primary hover:underline"
            >
              Manage
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {locationStats.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted">
                No locations yet. Add one to start collecting feedback.
              </div>
            ) : (
              locationStats.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-center justify-between rounded-xl bg-surface/60 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {loc.name}
                    </div>
                    <div className="mt-0.5 text-xs text-muted">
                      {loc.lastActivity
                        ? `Last activity ${formatDistanceToNow(loc.lastActivity, {
                            addSuffix: true,
                          })}`
                        : "No activity yet"}
                    </div>
                  </div>
                  <div className="ml-3 shrink-0 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                    {loc.sessionCount} session{loc.sessionCount !== 1 ? "s" : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick action */}
      {stats.totalSessions === 0 && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Ready to collect feedback?
              </h2>
              <p className="mt-1 text-sm text-muted">
                Share your feedback link with customers to start gathering insights.
              </p>
            </div>
            <Link
              href="/dashboard/locations"
              className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
            >
              Get your link
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
