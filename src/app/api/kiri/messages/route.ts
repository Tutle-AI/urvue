import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAccountContext } from "@/lib/business";
import { chatModel, openai } from "@/lib/openai";
import { parseKiriPageContext } from "@/lib/kiri-context";
import { featureEnabled } from "@/lib/features";

const kiriAnswerFormat = {
  type: "json_schema" as const,
  name: "kiri_answer",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["answer", "usedInsightIds"],
    properties: {
      answer: { type: "string" },
      usedInsightIds: { type: "array", items: { type: "string" } },
    },
  },
};

export async function POST(request: Request) {
  if (!featureEnabled("kiri")) return NextResponse.json({ error: "Kiri is temporarily unavailable" }, { status: 503 });
  try {
    const { account } = await requireAccountContext();
    const body = await request.json().catch(() => ({}));
    const question = typeof body.message === "string" ? body.message.trim().slice(0, 2_000) : "";
    const context = parseKiriPageContext(body.context, account.id);
    if (!question) return NextResponse.json({ error: "Question is required" }, { status: 400 });
    if (!context) return NextResponse.json({ error: "Invalid page context" }, { status: 403 });

    const space = await prisma.space.findFirst({
      where: { id: context.spaceId, accountId: account.id },
      include: {
        goals: { where: { active: true }, orderBy: { priority: "asc" } },
        businessChanges: { where: { status: { in: ["PLANNED", "ACTIVE"] } } },
      },
    });
    if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });

    let thread = typeof body.threadId === "string"
      ? await prisma.kiriThread.findFirst({ where: { id: body.threadId, accountId: account.id, spaceId: space.id } })
      : null;
    if (!thread) {
      thread = await prisma.kiriThread.create({
        data: { accountId: account.id, spaceId: space.id, title: question.slice(0, 80) },
      });
    }

    const analysisWhere = { conversation: { feedbackPoint: { spaceId: space.id } } };
    const [conversationCount, analyzedCount, sentimentRows, findingRows, insights, recentHistory] = await Promise.all([
      prisma.conversation.count({ where: { feedbackPoint: { spaceId: space.id } } }),
      prisma.conversationAnalysis.count({ where: analysisWhere }),
      prisma.conversationAnalysis.groupBy({ by: ["sentiment"], where: analysisWhere, _count: { _all: true } }),
      prisma.analysisFinding.groupBy({
        by: ["kind", "label"],
        where: { analysis: analysisWhere },
        _count: { _all: true },
        orderBy: { _count: { id: "desc" } },
        take: 20,
      }),
      prisma.insight.findMany({
        where: { spaceId: space.id, active: true },
        include: { evidence: { take: 5, select: { conversationId: true, excerpt: true } } },
        orderBy: { evidenceCount: "desc" },
        take: 12,
      }),
      prisma.kiriMessage.findMany({
        where: { threadId: thread.id },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);
    const sentimentCount = (sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE") => sentimentRows.find((row) => row.sentiment === sentiment)?._count._all || 0;
    const compactData = {
      space: { name: space.name, description: space.description, goals: space.goals.map((goal) => goal.label), changes: space.businessChanges.map((change) => change.title) },
      page: context,
      sample: {
        totalConversations: conversationCount,
        analyzedConversations: analyzedCount,
        sentiment: {
          positive: sentimentCount("POSITIVE"),
          neutral: sentimentCount("NEUTRAL"),
          negative: sentimentCount("NEGATIVE"),
        },
      },
      findings: findingRows.map((finding) => ({ label: `${finding.kind}: ${finding.label}`, count: finding._count._all })),
      insights: insights.map((insight) => ({
        id: insight.id,
        type: insight.type,
        title: insight.title,
        observation: insight.observation,
        recommendation: insight.recommendation,
        evidenceCount: insight.evidenceCount,
        confidence: insight.confidence,
        patternStrength: insight.patternStrength,
        evidence: insight.evidence.map((item) => ({ conversationId: item.conversationId, excerpt: item.excerpt })),
      })),
    };

    const history = [...recentHistory].reverse().map((item) => ({ role: item.role === "ASSISTANT" ? "assistant" as const : "user" as const, content: item.content }));
    const response = await openai.responses.create({
      model: chatModel,
      max_output_tokens: 500,
      store: false,
      input: [
        {
          role: "system",
          content: [
            "You are Kiri, UrVue's careful customer-intelligence analyst for a normal business owner.",
            "Answer only from the compact structured dataset supplied; never invent a fact or imply you read data that is absent.",
            "Every quantitative or evaluative answer must state the analyzed sample size and confidence/pattern strength.",
            "Treat one conversation as isolated, two to four as emerging, and five or more as potentially established.",
            "Do not rank staff unless at least eight distinct conversations support the ranking.",
            "When you rely on an insight, include its exact id in usedInsightIds. Do not include ids for insights you did not use.",
            "Be concise, warm, useful, and explicitly say when there is not enough evidence.",
          ].join(" "),
        },
        { role: "system", content: `Structured UrVue data:\n${JSON.stringify(compactData)}` },
        ...history,
        { role: "user", content: question },
      ],
      text: { format: kiriAnswerFormat },
    });
    const fallbackAnswer = `I don’t have enough structured feedback to answer that yet. I currently have ${analyzedCount} analyzed conversation${analyzedCount === 1 ? "" : "s"}.`;
    let parsed: { answer?: unknown; usedInsightIds?: unknown } = {};
    try {
      parsed = JSON.parse(response.output_text || "{}") as typeof parsed;
    } catch {
      // A malformed model response should fail closed without attaching unrelated evidence.
    }
    const answer = typeof parsed.answer === "string" && parsed.answer.trim() ? parsed.answer.trim() : fallbackAnswer;
    const allowedInsightIds = new Set(insights.map((insight) => insight.id));
    const usedInsightIds = new Set(
      Array.isArray(parsed.usedInsightIds)
        ? parsed.usedInsightIds.filter((id): id is string => typeof id === "string" && allowedInsightIds.has(id))
        : [],
    );
    const citations = insights.filter((insight) => usedInsightIds.has(insight.id)).flatMap((insight) => insight.evidence.map((item) => ({
      conversationId: item.conversationId,
      label: insight.title,
      href: `/dashboard/sessions/${item.conversationId}`,
    }))).filter((item, index, items) => items.findIndex((candidate) => candidate.conversationId === item.conversationId) === index).slice(0, 8);

    await prisma.$transaction([
      prisma.kiriMessage.create({ data: { threadId: thread.id, role: "USER", content: question, pageContext: context } }),
      prisma.kiriMessage.create({ data: { threadId: thread.id, role: "ASSISTANT", content: answer, pageContext: context, citations } }),
      prisma.kiriThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } }),
    ]);
    return NextResponse.json({ threadId: thread.id, answer, citations });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Kiri could not answer that right now." }, { status: 500 });
  }
}
