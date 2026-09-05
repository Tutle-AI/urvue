import { after, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { feedbackModel, openai } from "@/lib/openai";
import { checkRateLimit, credentialMatches, readBearerToken } from "@/lib/conversation-security";
import { finalReply, interviewSystemPrompt } from "@/lib/interview";
import { conversationBrief, pointContext } from "@/lib/feedback-point";
import { closeConversationAndEnqueueAnalysis, processIntelligenceJob } from "@/lib/intelligence";
import { featureEnabled } from "@/lib/features";

const replyFormat = {
  type: "json_schema" as const,
  name: "feedback_reply",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["reply", "finalize"],
    properties: {
      reply: { type: "string" },
      finalize: { type: "boolean" },
    },
  },
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!featureEnabled("publicConversations")) return NextResponse.json({ error: "Feedback is temporarily unavailable" }, { status: 503 });
  const { id } = await params;
  const rate = await checkRateLimit(request, `message:${id}`, 60, 10 * 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many messages. Please pause and try again." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 2_000) : "";
  if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      feedbackPoint: {
        include: {
          space: {
            select: { id: true },
          },
        },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 41 },
      _count: { select: { messages: { where: { role: "CUSTOMER" } } } },
    },
  });
  if (!conversation || !credentialMatches(readBearerToken(request), conversation.accessTokenHash)) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  if (conversation.status === "CLOSED") return NextResponse.json({ error: "Conversation is closed" }, { status: 409 });
  if (conversation._count.messages >= 20) return NextResponse.json({ error: "This conversation has reached its message limit." }, { status: 409 });

  const { space } = conversation.feedbackPoint;
  const brief = conversationBrief(conversation.feedbackPoint, conversation.interviewConfig);
  const customerMessage = await prisma.conversationMessage.create({
    data: { conversationId: id, role: "CUSTOMER", content: message },
  });
  const response = await openai.responses.create({
    model: feedbackModel,
    ...(feedbackModel.startsWith("gpt-5.6") ? { reasoning: { effort: "none" as const } } : {}),
    max_output_tokens: 500,
    store: false,
    input: [
      { role: "system", content: interviewSystemPrompt(brief.agentPersona) },
      {
        role: "system",
        content: [
          pointContext(brief),
          conversation._count.messages >= 19 ? "This is the last turn. Set finalize=true and acknowledge their feedback without asking another question." : "Continue naturally using the full conversation above to avoid repeating answered goals.",
        ].filter(Boolean).join("\n"),
      },
      ...[...conversation.messages].reverse().map((item) => ({
        role: item.role === "ASSISTANT" ? "assistant" as const : "user" as const,
        content: item.content,
      })),
      { role: "user" as const, content: customerMessage.content },
    ],
    text: { format: replyFormat },
  });
  const payload = JSON.parse(response.output_text || "{}") as { reply?: string; finalize?: boolean };
  const finalize = payload.finalize === true || conversation._count.messages >= 19;
  const reply = finalize ? finalReply(payload.reply) : payload.reply?.trim().slice(0, 1_000) || "Thanks for sharing that. What would you most like the team to change?";
  await prisma.conversationMessage.create({ data: { conversationId: id, role: "ASSISTANT", content: reply } });

  if (finalize) {
    const job = await closeConversationAndEnqueueAnalysis(id, space.id, new Date());
    after(() => processIntelligenceJob(job.id));
  }
  return NextResponse.json({ reply, finalize, analysisStatus: finalize ? "PENDING" : null });
}
