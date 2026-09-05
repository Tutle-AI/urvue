import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, createConversationCredential } from "@/lib/conversation-security";
import { openingMessage } from "@/lib/interview";
import { featureEnabled } from "@/lib/features";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!featureEnabled("publicConversations")) return NextResponse.json({ error: "Feedback is temporarily unavailable" }, { status: 503 });
  const { slug } = await params;
  const rate = await checkRateLimit(request, `start:${slug}`, 10, 10 * 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many conversations. Please try again later." }, { status: 429 });

  const body = await request.json().catch(() => ({}));
  const customerName = typeof body.customerName === "string" ? body.customerName.trim().slice(0, 80) : "";
  const point = await prisma.feedbackPoint.findUnique({
    where: { slug },
    include: { space: true },
  });
  if (!point || !point.active) return NextResponse.json({ error: "Feedback point not found" }, { status: 404 });

  const credential = createConversationCredential();
  const greeting = openingMessage({
    persona: point.space.agentPersona,
    customerName,
    spaceName: point.space.name,
    feedbackPointName: point.name,
  });
  const conversation = await prisma.conversation.create({
    data: {
      feedbackPointId: point.id,
      customerName: customerName || null,
      accessTokenHash: credential.hash,
      messages: { create: { role: "ASSISTANT", content: greeting } },
    },
  });
  return NextResponse.json({ conversationId: conversation.id, credential: credential.token, greeting }, { status: 201 });
}
