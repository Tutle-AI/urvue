import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { requireOnboardedBusiness } from "@/lib/business";
import { getSessionsWithFilters, getLocationStats } from "@/lib/stats";
import { SessionFilters } from "./session-filters";

function sentimentColor(sentiment: string | null | undefined) {
  const s = (sentiment || "").toUpperCase();
  if (s === "POSITIVE") return "bg-green-500/20 text-green-400";
  if (s === "NEGATIVE") return "bg-red-500/20 text-red-400";
  if (s === "NEUTRAL") return "bg-yellow-500/20 text-yellow-400";
  return "bg-foreground/10 text-muted";
}

function statusColor(status: string) {
  return status === "ACTIVE"
    ? "bg-blue-500/20 text-blue-400"
    : "bg-foreground/10 text-muted";
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    location?: string;
    sentiment?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const { business } = await requireOnboardedBusiness();

  const page = Math.max(1, parseInt(params.page || "1", 10));
  const sentiment = params.sentiment as
    | "POSITIVE"
    | "NEUTRAL"
    | "NEGATIVE"
    | "PENDING"
    | undefined;

  const [result, locations] = await Promise.all([
    getSessionsWithFilters(business.id, {
      locationId: params.location,
      sentiment,
      search: params.search,
      page,
      pageSize: 10,
    }),
    getLocationStats(business.id),
  ]);

  const { sessions, total, totalPages } = result;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Sessions
        </h1>
        <p className="mt-1 text-sm text-muted">
          {total} total session{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters */}
      <SessionFilters
        locations={locations}
        currentLocation={params.location}
        currentSentiment={params.sentiment}
        currentSearch={params.search}
      />

      {/* Sessions list */}
      <div className="rounded-2xl border border-border bg-card">
        {sessions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-muted">No sessions found</div>
            <p className="mt-1 text-sm text-muted">
              {params.location || params.sentiment || params.search
                ? "Try adjusting your filters"
                : "Share your feedback link to start collecting sessions"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/dashboard/sessions/${session.id}`}
                className="flex flex-col gap-3 p-4 transition hover:bg-surface/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">
                      {session.customerName || "Guest"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${statusColor(
                        session.status
                      )}`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    {session.location.name} •{" "}
                    {formatDistanceToNow(session.createdAt, { addSuffix: true })}
                  </div>
                  {session.summary && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted">
                      {session.summary.summary}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium uppercase ${sentimentColor(
                      session.summary?.sentiment
                    )}`}
                  >
                    {session.summary?.sentiment || "PENDING"}
                  </span>
                  <svg
                    className="h-5 w-5 shrink-0 text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <div className="text-sm text-muted">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={{
                    pathname: "/dashboard/sessions",
                    query: {
                      ...params,
                      page: page - 1,
                    },
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-surface"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={{
                    pathname: "/dashboard/sessions",
                    query: {
                      ...params,
                      page: page + 1,
                    },
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-surface"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
