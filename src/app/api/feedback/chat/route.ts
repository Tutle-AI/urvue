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

Conversation goals:
- Capture what went well and what could be improved.
- Ask about overall satisfaction (lightweight: e.g., “How satisfied were you?”).
- If appropriate, ask for a short review-style sentence the business could use publicly.
`;

function businessPrompt(business: {
  name: string;
  businessType: string | null;
  description: string | null;
  focusTopic1: string | null;
  focusTopic2: string | null;
  focusTopic3: string | null;
}) {
  const topics = [business.focusTopic1, business.focusTopic2, business.focusTopic3]
    .map((t) => (t || "").trim())
    .filter(Boolean);

  const lines: string[] = [];
  lines.push(`Business: ${business.name}`);
  if (business.businessType) lines.push(`Type: ${business.businessType}`);
  if (business.description) lines.push(`Context: ${business.description}`);
  if (topics.length) {
    lines.push("Focus topics (ask about these naturally):");
    for (const t of topics) lines.push(`- ${t}`);
  }
  lines.push(
    "Stay friendly and brief. Ask 1 targeted follow-up question at a time.",
  );

  return lines.join("\n");
}

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

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session" }, { status: 400 });
    }

    if (!message && !finalize) {
      return NextResponse.json(
        { error: "Missing message" },
        { status: 400 },
      );
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

    if (session.status === SessionStatus.CLOSED) {
      return NextResponse.json(
        { error: "Session is closed" },
        { status: 409 },
      );
    }

    if (message) {
    await prisma.feedbackMessage.create({
      data: {
        sessionId,
        role: "CUSTOMER",
        content: message,
      },
    });
    }

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
          content: businessPrompt(session.location.business),
        },
        {
          role: "system",
          content: `Location: ${session.location.name}. Keep the tone friendly and brief.`,
        },
        {
          role: "system",
          content:
            "Output JSON only with keys: reply (string), finalize (boolean). Set finalize=true when you have enough info and the guest seems done; your reply should be a friendly close-out when finalizing.",
        },
        ...messages.map((m) => ({
          role: mapRole(m.role) as "assistant" | "user",
          content: m.content,
        })),
      ],
      text: { format: { type: "json_object" } },
    });

    const payload = JSON.parse(aiResponse.output_text ?? "{}") as {
      reply?: string;
      finalize?: boolean;
    };

    const reply =
      (payload.reply || "").trim() ||
      "Thanks for sharing. Anything else we should improve?";
    const shouldFinalize = Boolean(payload.finalize) || finalize;

    await prisma.feedbackMessage.create({
      data: {
        sessionId,
        role: "ASSISTANT",
        content: reply,
      },
    });

    let summary = null;
    if (shouldFinalize) {
      summary = await generateSessionSummary(sessionId);
    }

    return NextResponse.json({ reply, summary, finalize: shouldFinalize });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to process message. Please try again." },
      { status: 500 },
    );
  }
}

