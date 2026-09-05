import { KiriChat } from "@/components/kiri-chat";
import { requireOnboardedSpace } from "@/lib/business";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { featureEnabled } from "@/lib/features";

export default async function KiriPage() {
  if (!featureEnabled("kiri")) notFound();
  const { account, space } = await requireOnboardedSpace();
  const thread = await prisma.kiriThread.findFirst({
    where: { accountId: account.id, spaceId: space.id },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 40 } },
    orderBy: { updatedAt: "desc" },
  });
  const initialMessages = [...(thread?.messages || [])].reverse().map((message) => ({
    role: message.role === "USER" ? "user" as const : "assistant" as const,
    content: message.content,
    citations: Array.isArray(message.citations) ? message.citations as Array<{ conversationId: string; label: string; href: string }> : undefined,
  }));

  return (
    <div className="space-y-5">
      <div><p className="text-sm text-primary">Your intelligence assistant</p><h1 className="mt-1 font-serif text-4xl text-foreground">Ask Kiri</h1><p className="mt-2 max-w-2xl text-sm text-muted">Kiri answers from {space.name}’s structured customer feedback and links claims back to the conversations behind them.</p></div>
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
        <KiriChat context={{ view: "kiri", accountId: account.id, spaceId: space.id }} initialThreadId={thread?.id} initialMessages={initialMessages} />
      </div>
    </div>
  );
}
