import {
  FindingKind,
  JobKind,
  Prisma,
  ReturnIntent,
  Sentiment,
  Severity,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { openai, summaryModel } from "@/lib/openai";
import { patternStrengthFor } from "@/lib/evidence-policy";
import { featureEnabled } from "@/lib/features";

const ANALYSIS_VERSION = 2;

const analysisFormat = {
  type: "json_schema" as const,
  name: "conversation_analysis",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["summary", "sentiment", "satisfaction", "confidence", "severity", "returnIntent", "findings"],
    properties: {
      summary: { type: "string" },
      sentiment: { type: "string", enum: ["POSITIVE", "NEUTRAL", "NEGATIVE"] },
      satisfaction: { type: ["number", "null"] },
      confidence: { type: ["number", "null"] },
      severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
      returnIntent: { type: "string", enum: ["YES", "MAYBE", "NO", "UNKNOWN"] },
      findings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["kind", "label", "detail", "sentiment", "severity", "confidence", "evidenceQuote", "entities"],
          properties: {
            kind: { type: "string", enum: ["TOPIC", "PRAISE", "COMPLAINT", "COMPLIMENT", "SUGGESTION", "ACTIONABLE_ISSUE"] },
            label: { type: "string" },
            detail: { type: ["string", "null"] },
            sentiment: { type: ["string", "null"], enum: ["POSITIVE", "NEUTRAL", "NEGATIVE", null] },
            severity: { type: ["string", "null"], enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL", null] },
            confidence: { type: ["number", "null"] },
            evidenceQuote: { type: ["string", "null"] },
            entities: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["type", "name", "sentiment", "confidence"],
                properties: {
                  type: { type: "string", enum: ["PERSON", "PRODUCT", "SERVICE", "LOCATION"] },
                  name: { type: "string" },
                  sentiment: { type: ["string", "null"], enum: ["POSITIVE", "NEUTRAL", "NEGATIVE", null] },
                  confidence: { type: ["number", "null"] },
                },
              },
            },
          },
        },
      },
    },
  },
};

type AnalysisPayload = {
  summary: string;
  sentiment: Sentiment;
  satisfaction: number | null;
  confidence: number | null;
  severity: Severity;
  returnIntent: ReturnIntent;
  findings: Array<{
    kind: FindingKind;
    label: string;
    detail: string | null;
    sentiment: Sentiment | null;
    severity: Severity | null;
    confidence: number | null;
    evidenceQuote: string | null;
    entities: Array<{
      type: "PERSON" | "PRODUCT" | "SERVICE" | "LOCATION";
      name: string;
      sentiment: Sentiment | null;
      confidence: number | null;
    }>;
  }>;
};

function clamp(value: number | null, min: number, max: number) {
  return value === null || !Number.isFinite(value) ? null : Math.max(min, Math.min(max, value));
}

function cleanPayload(payload: AnalysisPayload): AnalysisPayload {
  return {
    summary: payload.summary?.trim() || "Customer shared feedback.",
    sentiment: payload.sentiment || "NEUTRAL",
    satisfaction: clamp(payload.satisfaction, 1, 5),
    confidence: clamp(payload.confidence, 0, 1),
    severity: payload.severity || "MEDIUM",
    returnIntent: payload.returnIntent || "UNKNOWN",
    findings: (payload.findings || []).slice(0, 16).flatMap((finding) => {
      const label = finding.label?.trim();
      if (!label) return [];
      return [{
        ...finding,
        label: label.slice(0, 120),
        detail: finding.detail?.trim().slice(0, 500) || null,
        confidence: clamp(finding.confidence, 0, 1),
        evidenceQuote: finding.evidenceQuote?.trim().slice(0, 280) || null,
        entities: (finding.entities || []).slice(0, 8).filter((entity) => entity.name?.trim()),
      }];
    }),
  };
}

export async function enqueueIntelligenceJob(args: {
  kind: JobKind;
  dedupeKey: string;
  payload: Prisma.InputJsonValue;
  spaceId?: string;
}) {
  return prisma.intelligenceJob.upsert({
    where: { dedupeKey: args.dedupeKey },
    update: {},
    create: args,
  });
}

export async function enqueueConversationAnalysis(conversationId: string, spaceId: string) {
  return enqueueIntelligenceJob({
    kind: "ANALYZE_CONVERSATION",
    dedupeKey: `analyze:${conversationId}:v${ANALYSIS_VERSION}`,
    payload: { conversationId, version: ANALYSIS_VERSION },
    spaceId,
  });
}

export async function closeConversationAndEnqueueAnalysis(
  conversationId: string,
  spaceId: string,
  closedAt: Date,
) {
  return prisma.$transaction(async (tx) => {
    await tx.conversation.update({
      where: { id: conversationId },
      data: { status: "CLOSED", closedAt },
    });
    return tx.intelligenceJob.upsert({
      where: { dedupeKey: `analyze:${conversationId}:v${ANALYSIS_VERSION}` },
      update: {},
      create: {
        kind: "ANALYZE_CONVERSATION",
        dedupeKey: `analyze:${conversationId}:v${ANALYSIS_VERSION}`,
        payload: { conversationId, version: ANALYSIS_VERSION },
        spaceId,
      },
    });
  });
}

export async function analyzeConversation(conversationId: string) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
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
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!conversation) throw new Error("Conversation not found");
    const customerMessages = conversation.messages.filter((message) => message.role === "CUSTOMER");
    if (!customerMessages.length) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: "CLOSED", analysisStatus: "SKIPPED", closedAt: conversation.closedAt || new Date() },
      });
      return { status: "skipped" as const };
    }
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { analysisStatus: "PROCESSING" },
    });

    const { space } = conversation.feedbackPoint;
    const transcript = conversation.messages.map((message) => `${message.role}: ${message.content}`).join("\n");
    const response = await openai.responses.create({
      model: summaryModel,
      max_output_tokens: 1_200,
      store: false,
      input: [
        {
          role: "system",
          content: [
            "Analyze a customer interview into factual, reusable customer intelligence.",
            "Do not invent details. Use short canonical labels that can be grouped across conversations.",
            "Every finding must use a verbatim customer excerpt when one exists.",
            "Be cautious about named staff and use UNKNOWN when intent is not inferable.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            `Space: ${space.name}`,
            space.businessType ? `Type: ${space.businessType}` : null,
            space.description ? `Context: ${space.description}` : null,
            space.goals.length ? `Goals: ${space.goals.map((goal) => goal.label).join("; ")}` : null,
            space.trackedEntities.length ? `Tracked entities: ${space.trackedEntities.map((entity) => `${entity.type}:${entity.name}`).join("; ")}` : null,
            space.businessChanges.length ? `Recent changes: ${space.businessChanges.map((change) => change.title).join("; ")}` : null,
            `Feedback point: ${conversation.feedbackPoint.name}`,
            "Transcript:",
            transcript,
          ].filter(Boolean).join("\n"),
        },
      ],
      text: { format: analysisFormat },
    });

    const payload = cleanPayload(JSON.parse(response.output_text || "{}") as AnalysisPayload);
    const lastCustomerMessage = [...conversation.messages].reverse().find((message) => message.role === "CUSTOMER");

    await prisma.$transaction(async (tx) => {
      const analysis = await tx.conversationAnalysis.upsert({
        where: { conversationId },
        create: {
          conversationId,
          summary: payload.summary,
          sentiment: payload.sentiment,
          satisfaction: payload.satisfaction,
          confidence: payload.confidence,
          severity: payload.severity,
          returnIntent: payload.returnIntent,
          version: ANALYSIS_VERSION,
        },
        update: {
          summary: payload.summary,
          sentiment: payload.sentiment,
          satisfaction: payload.satisfaction,
          confidence: payload.confidence,
          severity: payload.severity,
          returnIntent: payload.returnIntent,
          version: ANALYSIS_VERSION,
          provenance: "ai",
        },
      });
      await tx.analysisFinding.deleteMany({ where: { analysisId: analysis.id } });

      for (const finding of payload.findings) {
        const evidence = finding.evidenceQuote
          ? conversation.messages.find((message) => message.role === "CUSTOMER" && message.content.toLowerCase().includes(finding.evidenceQuote!.toLowerCase()))
          : null;
        const created = await tx.analysisFinding.create({
          data: {
            analysisId: analysis.id,
            kind: finding.kind,
            label: finding.label,
            detail: finding.detail,
            sentiment: finding.sentiment,
            severity: finding.severity,
            confidence: finding.confidence,
            evidenceMessageId: evidence?.id || lastCustomerMessage?.id || null,
          },
        });

        for (const entity of finding.entities) {
          const name = entity.name.trim().slice(0, 100);
          const tracked = await tx.trackedEntity.upsert({
            where: { spaceId_type_name: { spaceId: space.id, type: entity.type, name } },
            create: { spaceId: space.id, type: entity.type, name, source: "SYSTEM" },
            update: { active: true },
          });
          await tx.entityMention.create({
            data: {
              findingId: created.id,
              entityId: tracked.id,
              sentiment: entity.sentiment,
              confidence: clamp(entity.confidence, 0, 1),
            },
          });
        }
      }

      await tx.conversation.update({
        where: { id: conversationId },
        data: { status: "CLOSED", analysisStatus: "COMPLETE", closedAt: conversation.closedAt || new Date() },
      });
    });

    await enqueueIntelligenceJob({
      kind: "REFRESH_SPACE_INSIGHTS",
      dedupeKey: `refresh:${space.id}:after:${conversationId}:v${ANALYSIS_VERSION}`,
      payload: { spaceId: space.id },
      spaceId: space.id,
    });
    return { status: "complete" as const };
  } catch (error) {
    await prisma.conversation.updateMany({ where: { id: conversationId }, data: { analysisStatus: "FAILED" } });
    throw error;
  }
}

export async function refreshSpaceInsights(spaceId: string) {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60_000);
  const grouped = await prisma.analysisFinding.groupBy({
    by: ["kind", "label"],
    where: {
      kind: { not: "TOPIC" },
      analysis: {
        conversation: {
          createdAt: { gte: since },
          feedbackPoint: { spaceId },
        },
      },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 40,
  });
  const selections = [
    ...grouped.filter((group) => group.kind === "PRAISE" || group.kind === "COMPLIMENT").slice(0, 2),
    ...grouped.filter((group) => group.kind === "COMPLAINT").slice(0, 2),
    ...grouped.filter((group) => group.kind === "ACTIONABLE_ISSUE" || group.kind === "SUGGESTION").slice(0, 2),
  ];

  const evidenceGroups = await Promise.all(selections.map(async (group) => ({
    group,
    items: await prisma.analysisFinding.findMany({
      where: {
        kind: group.kind,
        label: group.label,
        analysis: {
          conversation: {
            createdAt: { gte: since },
            feedbackPoint: { spaceId },
          },
        },
      },
      include: {
        analysis: { select: { conversationId: true } },
        evidenceMessage: { select: { content: true } },
      },
      orderBy: { createdAt: "desc" },
      distinct: ["analysisId"],
      take: 20,
    }),
  })));

  await prisma.$transaction(async (tx) => {
    // Insights are derived and reproducible. Weekly snapshots retain historical reports.
    await tx.insight.deleteMany({ where: { spaceId } });
    for (const { group, items } of evidenceGroups) {
      const conversationIds = [...new Set(items.map((item) => item.analysis.conversationId))];
      const count = conversationIds.length;
      if (!count) continue;
      const type = group.kind === "PRAISE" || group.kind === "COMPLIMENT"
        ? "GOING_WELL"
        : group.kind === "COMPLAINT"
          ? "NEEDS_ATTENTION"
          : "RECOMMENDATION";
      const confidenceValues = items.map((item) => item.confidence).filter((value): value is number => value !== null);
      const confidence = confidenceValues.length
        ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
        : count >= 5 ? 0.82 : count >= 2 ? 0.65 : 0.45;
      await tx.insight.create({
        data: {
          spaceId,
          type,
          title: group.label,
          observation: `${count} ${count === 1 ? "conversation mentions" : "conversations mention"} ${group.label.toLowerCase()}.`,
          recommendation: type === "NEEDS_ATTENTION"
            ? `Review the supporting feedback and decide whether ${group.label.toLowerCase()} needs a near-term response.`
            : type === "RECOMMENDATION" ? group.label : null,
          confidence,
          patternStrength: patternStrengthFor(count),
          evidenceCount: count,
          periodStart: since,
          periodEnd: new Date(),
          evidence: {
            create: conversationIds.map((conversationId) => {
              const item = items.find((finding) => finding.analysis.conversationId === conversationId)!;
              return {
                conversationId,
                findingId: item.id,
                excerpt: item.evidenceMessage?.content.slice(0, 280) || item.detail,
              };
            }),
          },
        },
      });
    }
  });
}

export async function processIntelligenceJob(jobId: string) {
  if (!featureEnabled("analysisV2")) return { id: jobId, status: "disabled" };
  const job = await prisma.intelligenceJob.findUnique({ where: { id: jobId } });
  if (!job || job.status === "COMPLETE") return { id: jobId, status: "complete" };
  if (job.runAt > new Date()) return { id: jobId, status: "scheduled" };
  const claimed = await prisma.intelligenceJob.updateMany({
    where: { id: job.id, status: "PENDING" },
    data: { status: "PROCESSING", lockedAt: new Date(), attempts: { increment: 1 } },
  });
  if (!claimed.count) return { id: job.id, status: "busy" };
  try {
    const payload = job.payload as { conversationId?: string; spaceId?: string };
    if (job.kind === "ANALYZE_CONVERSATION" && payload.conversationId) {
      await analyzeConversation(payload.conversationId);
    } else if (job.kind === "REFRESH_SPACE_INSIGHTS" && (payload.spaceId || job.spaceId)) {
      await refreshSpaceInsights(payload.spaceId || job.spaceId!);
    }
    await prisma.intelligenceJob.update({
      where: { id: job.id },
      data: { status: "COMPLETE", lockedAt: null, lastError: null },
    });
    return { id: job.id, status: "complete" };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : "Unknown job error";
    const exhausted = job.attempts + 1 >= job.maxAttempts;
    await prisma.intelligenceJob.update({
      where: { id: job.id },
      data: {
        status: exhausted ? "FAILED" : "PENDING",
        lockedAt: null,
        lastError: message,
        runAt: new Date(Date.now() + Math.min(60, 2 ** (job.attempts + 1)) * 60_000),
      },
    });
    return { id: job.id, status: exhausted ? "failed" : "retrying" };
  }
}

export async function processIntelligenceJobs(limit = 5) {
  const stale = new Date(Date.now() - 10 * 60_000);
  await prisma.intelligenceJob.updateMany({
    where: { status: "PROCESSING", lockedAt: { lt: stale } },
    data: { status: "PENDING", lockedAt: null },
  });
  const jobs = await prisma.intelligenceJob.findMany({
    where: { status: "PENDING", runAt: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  const results: Array<{ id: string; status: string }> = [];

  for (const job of jobs) results.push(await processIntelligenceJob(job.id));
  return results;
}
