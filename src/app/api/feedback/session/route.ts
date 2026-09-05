import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createConversationCredential } from "@/lib/conversation-security";
import { openingMessage } from "@/lib/interview";
import { checkRateLimit } from "@/lib/conversation-security";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = typeof body.slug === "string" ? body.slug : "";
    const customerName =
      typeof body.customerName === "string" ? body.customerName.trim().slice(0, 80) || null : null;

    if (!slug) {
      return NextResponse.json({ error: "Missing location slug" }, { status: 400 });
    }

    const feedbackPoint = await prisma.feedbackPoint.findUnique({
      where: { slug },
      include: { space: true },
    });

    if (!feedbackPoint || !feedbackPoint.active) {
      return NextResponse.json({ error: "Feedback point not found" }, { status: 404 });
    }
    const rate = await checkRateLimit(request, `legacy-start:${slug}`, 10, 10 * 60_000);
    if (!rate.allowed) return NextResponse.json({ error: "Too many conversations. Please try again later." }, { status: 429 });

    const credential = createConversationCredential();
    const greeting = openingMessage({
      persona: feedbackPoint.space.agentPersona,
      customerName,
      spaceName: feedbackPoint.space.name,
      feedbackPointName: feedbackPoint.name,
    });
    const conversation = await prisma.conversation.create({
      data: {
        feedbackPointId: feedbackPoint.id,
        customerName,
        status: "ACTIVE",
        accessTokenHash: credential.hash,
        messages: { create: { role: "ASSISTANT", content: greeting } },
      },
    });

    return NextResponse.json({
      sessionId: conversation.id,
      conversationId: conversation.id,
      credential: credential.token,
      greeting,
      deprecated: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
  }
}

