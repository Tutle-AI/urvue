import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireDbUser } from "@/lib/auth";
import { SummarizeButton } from "@/components/summarize-button";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { dbUser } = await requireDbUser();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-primary underline">
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">
            Session at {session.location.name}
          </h1>
          <p className="text-sm text-muted">
            {session.customerName || "Guest"} • {session.location.business.name}
          </p>
        </div>
        {!session.summary && <SummarizeButton sessionId={session.id} />}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Summary</h2>
          {session.summary && (
            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs uppercase tracking-wide text-primary">
              {session.summary.sentiment}
            </div>
          )}
        </div>
        <p className="mt-3 text-sm text-muted">
          {session.summary?.summary || "No summary yet. Generate one to condense this chat."}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold text-foreground">Transcript</h2>
        <div className="mt-4 space-y-3">
          {session.messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "ASSISTANT"
                  ? "bg-surface text-foreground"
                  : "bg-primary/10 text-foreground"
              }`}
            >
              <span className="block text-xs uppercase tracking-wide text-muted">
                {msg.role === "ASSISTANT" ? "URVUE" : "Customer"}
              </span>
              {msg.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

