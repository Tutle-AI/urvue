import { MessageRole, SessionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chatModel, openai } from "@/lib/openai";
import { generateSessionSummary } from "@/lib/summary";

const systemPrompt = `
You are URVUE, a warm and concise feedback assistant for small businesses.
- Keep replies under 60 words.
- Ask targeted follow-up questions to uncover specifics (what worked, what to improve).
- Be empathetic, avoid corporate tone, and thank the guest for their time.
- If the guest is done, acknowledge and let them know their feedback will reach the team.
`;

function mapRole(role: MessageRole) {
  if (role === "ASSISTANT") return "assistant";
  return "user";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const finalize = Boolean(body.finalize);

    if (!sessionId || !message) {
      return NextResponse.json({ error: "Missing session or message" }, { status: 400 });
    }

    const session = await prisma.feedbackSession.findUnique({
      where: { id: sessionId },
      include: {
        location: {
          include: { business: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await prisma.feedbackMessage.create({
      data: {
        sessionId,
        role: "CUSTOMER",
        content: message,
      },
    });

    const messages = await prisma.feedbackMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    const aiResponse = await openai.responses.create({
      model: chatModel,
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "system",
          content: `Business: ${session.location.business.name}. Location: ${session.location.name}. Keep the tone friendly and brief.`,
        },
        ...messages.map((m) => ({
          role: mapRole(m.role) as "assistant" | "user",
          content: m.content,
        })),
      ],
    });

    const reply =
      aiResponse.output_text?.trim() ||
      "Thanks for sharing. Anything else we should improve?";

    await prisma.feedbackMessage.create({
      data: {
        sessionId,
        role: "ASSISTANT",
        content: reply,
      },
    });

    let summary = null;
    if (finalize || session.status === SessionStatus.CLOSED) {
      summary = await generateSessionSummary(sessionId);
    }

    return NextResponse.json({ reply, summary });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to process message. Please try again." },
      { status: 500 },
    );
  }
}

