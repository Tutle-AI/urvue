import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOnboardedBusiness } from "@/lib/business";
import { SummarizeButton } from "@/components/summarize-button";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { dbUser } = await requireOnboardedBusiness();

  const session = await prisma.feedbackSession.findUnique({
    where: { id },
    include: {
      location: {
        include: { business: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
      summary: true,
    },
  });

  if (!session || session.location.business.ownerId !== dbUser.id) {
    notFound();
  }

  const sentimentColor = (sentiment: string | null | undefined) => {
    const s = (sentiment || "").toUpperCase();
    if (s === "POSITIVE") return "bg-green-500/20 text-green-400";
    if (s === "NEGATIVE") return "bg-red-500/20 text-red-400";
    if (s === "NEUTRAL") return "bg-yellow-500/20 text-yellow-400";
    return "bg-foreground/10 text-muted";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard/sessions"
            className="inline-flex items-center gap-1 text-sm text-muted transition hover:text-foreground"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to sessions
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
            {session.customerName || "Guest"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {session.location.name} • {session.location.business.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {session.summary && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium uppercase ${sentimentColor(
                session.summary.sentiment
              )}`}
            >
              {session.summary.sentiment}
            </span>
          )}
          {!session.summary && <SummarizeButton sessionId={session.id} />}
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-foreground">AI Summary</h2>
          {session.summary?.score && (
            <span className="text-xs text-muted">
              {Math.round(session.summary.score * 100)}% confidence
            </span>
          )}
        </div>
        {session.summary ? (
          <div className="mt-3 whitespace-pre-wrap text-sm text-muted">
            {session.summary.summary}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted">
            No summary yet. Click &quot;Generate Summary&quot; to analyze this conversation.
          </div>
        )}
      </div>

      {/* Transcript */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-medium text-foreground">Conversation</h2>
        <p className="mt-1 text-xs text-muted">
          {session.messages.length} message{session.messages.length !== 1 ? "s" : ""}
        </p>
        <div className="mt-4 space-y-3">
          {session.messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl px-4 py-3 ${
                msg.role === "ASSISTANT"
                  ? "bg-surface"
                  : "ml-8 bg-primary/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  {msg.role === "ASSISTANT" ? "URVUE" : "Customer"}
                </span>
                <span className="text-xs text-muted">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                {msg.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

