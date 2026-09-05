import { after, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chatModel, openai } from "@/lib/openai";
import { checkRateLimit, credentialMatches, readBearerToken } from "@/lib/conversation-security";
import { interviewSystemPrompt } from "@/lib/interview";
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
            include: {
              goals: { where: { active: true }, orderBy: { priority: "asc" } },
              trackedEntities: { where: { active: true } },
              businessChanges: { where: { status: { in: ["PLANNED", "ACTIVE"] } } },
            },
          },
        },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 24 },
      _count: { select: { messages: { where: { role: "CUSTOMER" } } } },
    },
  });
  if (!conversation || !credentialMatches(readBearerToken(request), conversation.accessTokenHash)) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  if (conversation.status === "CLOSED") return NextResponse.json({ error: "Conversation is closed" }, { status: 409 });
  if (conversation._count.messages >= 20) return NextResponse.json({ error: "This conversation has reached its message limit." }, { status: 409 });

  const { space } = conversation.feedbackPoint;
  const customerMessage = await prisma.conversationMessage.create({
    data: { conversationId: id, role: "CUSTOMER", content: message },
  });
  const response = await openai.responses.create({
    model: chatModel,
    max_output_tokens: 180,
    store: false,
    input: [
      { role: "system", content: interviewSystemPrompt(space.agentPersona) },
      {
        role: "system",
        content: [
          `Space: ${space.name}`,
          space.businessType ? `Type: ${space.businessType}` : null,
          space.description ? `Context: ${space.description}` : null,
          space.goals.length ? `Goals: ${space.goals.map((goal) => goal.label).join("; ")}` : null,
          space.trackedEntities.length ? `Listen for: ${space.trackedEntities.map((entity) => entity.name).join("; ")}` : null,
          space.businessChanges.length ? `Recent changes: ${space.businessChanges.map((change) => change.title).join("; ")}` : null,
          `Feedback point: ${conversation.feedbackPoint.name}`,
          "Set finalize=true when at least one concrete detail and its reason are clear, or the customer wants to stop.",
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
  const reply = payload.reply?.trim().slice(0, 1_000) || "Thanks for sharing that. What would you most like the team to change?";
  await prisma.conversationMessage.create({ data: { conversationId: id, role: "ASSISTANT", content: reply } });

  if (payload.finalize) {
    const job = await closeConversationAndEnqueueAnalysis(id, space.id, new Date());
    after(() => processIntelligenceJob(job.id));
  }
  return NextResponse.json({ reply, finalize: Boolean(payload.finalize), analysisStatus: payload.finalize ? "PENDING" : null });
}
