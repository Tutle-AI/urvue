import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const requireHistoricalBaseline = process.argv.includes("--baseline");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const [
    accounts,
    memberships,
    spaces,
    unassignedSpaces,
    feedbackPoints,
    conversations,
    messages,
    legacySummaries,
    legacyInsights,
    analyses,
    findings,
    activeInsights,
    activeInsightsWithoutEvidence,
    unfinishedJobs,
    failedJobs,
    skippedConversations,
  ] = await Promise.all([
    prisma.account.count(),
    prisma.accountMembership.count(),
    prisma.space.count(),
    prisma.space.count({ where: { accountId: null } }),
    prisma.feedbackPoint.count(),
    prisma.conversation.count(),
    prisma.conversationMessage.count(),
    prisma.feedbackSummary.count(),
    prisma.feedbackInsight.count(),
    prisma.conversationAnalysis.count(),
    prisma.analysisFinding.count(),
    prisma.insight.count({ where: { active: true } }),
    prisma.insight.count({ where: { active: true, evidence: { none: {} } } }),
    prisma.intelligenceJob.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
    prisma.intelligenceJob.count({ where: { status: "FAILED" } }),
    prisma.conversation.count({ where: { analysisStatus: "SKIPPED" } }),
  ]);

  assert(unassignedSpaces === 0, `${unassignedSpaces} Space(s) are missing an Account`);
  assert(memberships >= accounts, "One or more Accounts have no membership");
  assert(activeInsightsWithoutEvidence === 0, `${activeInsightsWithoutEvidence} active Insight(s) have no evidence`);
  assert(unfinishedJobs === 0, `${unfinishedJobs} intelligence job(s) are unfinished`);
  assert(failedJobs === 0, `${failedJobs} intelligence job(s) have failed`);

  if (requireHistoricalBaseline) {
    assert(accounts === 2, `Expected 2 Accounts, found ${accounts}`);
    assert(memberships === 2, `Expected 2 memberships, found ${memberships}`);
    assert(spaces === 2, `Expected 2 Spaces, found ${spaces}`);
    assert(feedbackPoints === 2, `Expected 2 Feedback Points, found ${feedbackPoints}`);
    assert(conversations === 9, `Expected 9 Conversations, found ${conversations}`);
    assert(messages === 89, `Expected 89 messages, found ${messages}`);
    assert(legacySummaries === 6, `Expected 6 legacy summaries, found ${legacySummaries}`);
    assert(legacyInsights === 2, `Expected 2 legacy structured insights, found ${legacyInsights}`);
  }

  console.log(JSON.stringify({
    accounts,
    memberships,
    spaces,
    feedbackPoints,
    conversations,
    messages,
    legacySummaries,
    legacyInsights,
    analyses,
    findings,
    activeInsights,
    skippedConversations,
    unfinishedJobs,
    failedJobs,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
