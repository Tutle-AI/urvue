import { after, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { credentialMatches, readBearerToken } from "@/lib/conversation-security";
import { closeConversationAndEnqueueAnalysis, processIntelligenceJob } from "@/lib/intelligence";
import { featureEnabled } from "@/lib/features";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!featureEnabled("publicConversations")) return NextResponse.json({ error: "Feedback is temporarily unavailable" }, { status: 503 });
  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { feedbackPoint: true, _count: { select: { messages: { where: { role: "CUSTOMER" } } } } },
  });
  if (!conversation || !credentialMatches(readBearerToken(request), conversation.accessTokenHash)) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  if (!conversation._count.messages) return NextResponse.json({ error: "Share at least one response first" }, { status: 400 });

  if (conversation.analysisStatus !== "COMPLETE") {
    const job = await closeConversationAndEnqueueAnalysis(id, conversation.feedbackPoint.spaceId, conversation.closedAt || new Date());
    after(() => processIntelligenceJob(job.id));
  } else if (conversation.status !== "CLOSED") {
    await prisma.conversation.update({
      where: { id },
      data: { status: "CLOSED", closedAt: conversation.closedAt || new Date() },
    });
  }
  return NextResponse.json({ accepted: true, analysisStatus: conversation.analysisStatus === "COMPLETE" ? "COMPLETE" : "PENDING" }, { status: 202 });
}
