import { NextResponse } from "next/server";
import { generateSessionSummary } from "@/lib/summary";
import { prisma } from "@/lib/db";
import { requireDbUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const { dbUser } = await requireDbUser();
    const conversation = await prisma.conversation.findFirst({
      where: { id: sessionId, feedbackPoint: { space: { ownerId: dbUser.id } } },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    const summary = await generateSessionSummary(sessionId);
    const insight = await prisma.feedbackInsight.findUnique({
      where: { conversationId: sessionId },
    });
    return NextResponse.json({ summary, insight });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 },
    );
  }
}

