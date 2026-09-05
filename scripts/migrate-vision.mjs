import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const findingGroups = [
  ["themes", "TOPIC"],
  ["painPoints", "COMPLAINT"],
  ["praise", "PRAISE"],
  ["featureRequests", "SUGGESTION"],
  ["suggestedActions", "ACTIONABLE_ISSUE"],
];

function severityFromUrgency(urgency) {
  if (urgency === "high") return "HIGH";
  if (urgency === "low") return "LOW";
  return "MEDIUM";
}

async function backfillAccounts() {
  const users = await prisma.user.findMany({
    include: {
      memberships: { include: { account: true } },
      legacySpaces: { orderBy: { createdAt: "asc" } },
    },
  });

  for (const user of users) {
    if (!user.legacySpaces.length) continue;

    let account = user.memberships.find((membership) => membership.role === "OWNER")?.account;
    if (!account) {
      const source = user.legacySpaces[0];
      account = await prisma.account.create({
        data: {
          name: source.name,
          plan: source.plan,
          stripeCustomerId: source.stripeCustomerId,
          stripeSubscriptionId: source.stripeSubscriptionId,
          trialEndsAt: source.trialEndsAt,
          memberships: { create: { userId: user.id, role: "OWNER" } },
        },
      });
    }

    await prisma.space.updateMany({
      where: { ownerId: user.id, accountId: null },
      data: { accountId: account.id },
    });
  }
}

async function backfillGoals() {
  const spaces = await prisma.space.findMany({ include: { goals: true } });
  for (const space of spaces) {
    if (space.goals.length) continue;
    const labels = [space.focusTopic1, space.focusTopic2, space.focusTopic3]
      .map((label) => label?.trim())
      .filter(Boolean);
    if (!labels.length) continue;
    await prisma.spaceGoal.createMany({
      data: labels.map((label, priority) => ({
        spaceId: space.id,
        label,
        priority,
        source: "SYSTEM",
      })),
    });
  }
}

async function backfillAnalysesAndJobs() {
  const conversations = await prisma.conversation.findMany({
    include: {
      feedbackPoint: true,
      legacySummary: true,
      legacyInsight: true,
      analysis: true,
      messages: { where: { role: "CUSTOMER" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  for (const conversation of conversations) {
    if (!conversation.messages.length) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: "CLOSED", analysisStatus: "SKIPPED", closedAt: conversation.closedAt || new Date() },
      });
      continue;
    }
    if (!conversation.analysis && (conversation.legacyInsight || conversation.legacySummary)) {
      const insight = conversation.legacyInsight;
      const summary = conversation.legacySummary;
      const analysis = await prisma.conversationAnalysis.create({
        data: {
          conversationId: conversation.id,
          summary: insight?.summary || summary?.summary || "Legacy customer feedback",
          sentiment: insight?.sentiment || summary?.sentiment || "NEUTRAL",
          satisfaction: insight?.satisfactionScore ?? null,
          confidence: insight?.confidence ?? null,
          severity: severityFromUrgency(insight?.urgency),
          version: 1,
          provenance: insight ? "legacy-feedback-insight" : "legacy-summary",
        },
      });

      if (insight) {
        const evidenceMessageId = conversation.messages[0]?.id ?? null;
        const findings = findingGroups.flatMap(([field, kind]) =>
          (insight[field] || []).map((label) => ({
            analysisId: analysis.id,
            kind,
            label,
            confidence: insight.confidence,
            evidenceMessageId,
          })),
        );
        if (findings.length) await prisma.analysisFinding.createMany({ data: findings });
      }
    }

    await prisma.intelligenceJob.upsert({
      where: { dedupeKey: `analyze:${conversation.id}:v2` },
      update: {},
      create: {
        kind: "ANALYZE_CONVERSATION",
        dedupeKey: `analyze:${conversation.id}:v2`,
        payload: { conversationId: conversation.id, version: 2 },
        spaceId: conversation.feedbackPoint.spaceId,
      },
    });
  }
}

async function main() {
  await backfillAccounts();
  await backfillGoals();
  await backfillAnalysesAndJobs();

  const [accounts, memberships, spaces, points, conversations, messages, analyses, jobs] =
    await Promise.all([
      prisma.account.count(),
      prisma.accountMembership.count(),
      prisma.space.count(),
      prisma.feedbackPoint.count(),
      prisma.conversation.count(),
      prisma.conversationMessage.count(),
      prisma.conversationAnalysis.count(),
      prisma.intelligenceJob.count(),
    ]);

  console.log(
    JSON.stringify({ accounts, memberships, spaces, points, conversations, messages, analyses, jobs }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
