import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type BusinessStats = {
  totalSessions: number;
  summarizedSessions: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number; pending: number };
  thisWeekSessions: number;
};
export type LocationStat = { id: string; name: string; slug: string; sessionCount: number; lastActivity: Date | null };
export type RankedInsight = { label: string; count: number };

export async function getBusinessStats(spaceId: string): Promise<BusinessStats> {
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);
  const conversationWhere = { feedbackPoint: { spaceId } };
  const analysisWhere = { conversation: { feedbackPoint: { spaceId } } };
  const [statusRows, sentimentRows, thisWeek] = await Promise.all([
    prisma.conversation.groupBy({ by: ["analysisStatus"], where: conversationWhere, _count: { _all: true } }),
    prisma.conversationAnalysis.groupBy({ by: ["sentiment"], where: analysisWhere, _count: { _all: true } }),
    prisma.conversation.count({ where: { ...conversationWhere, createdAt: { gte: startOfThisWeek } } }),
  ]);
  const statusCount = (status: "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED" | "SKIPPED") => statusRows.find((row) => row.analysisStatus === status)?._count._all || 0;
  const total = statusRows.reduce((sum, row) => sum + row._count._all, 0);
  const analyzed = statusCount("COMPLETE");
  const sentimentCount = (sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE") => sentimentRows.find((row) => row.sentiment === sentiment)?._count._all || 0;
  return {
    totalSessions: total,
    summarizedSessions: analyzed,
    sentimentBreakdown: {
      positive: sentimentCount("POSITIVE"),
      neutral: sentimentCount("NEUTRAL"),
      negative: sentimentCount("NEGATIVE"),
      pending: statusCount("PENDING") + statusCount("PROCESSING"),
    },
    thisWeekSessions: thisWeek,
  };
}

export async function getLocationStats(spaceId: string): Promise<LocationStat[]> {
  const points = await prisma.feedbackPoint.findMany({
    where: { spaceId, active: true },
    include: {
      conversations: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      _count: { select: { conversations: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return points.map((point) => ({
    id: point.id,
    name: point.name,
    slug: point.slug,
    sessionCount: point._count.conversations,
    lastActivity: point.conversations[0]?.createdAt || null,
  }));
}

export async function getRecentSessions(spaceId: string, limit = 5) {
  return prisma.conversation.findMany({
    where: { feedbackPoint: { spaceId } },
    select: {
      id: true,
      customerName: true,
      createdAt: true,
      feedbackPoint: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getSessionsWithFilters(spaceId: string, options: {
  locationId?: string;
  sentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "PENDING";
  search?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const { locationId, sentiment, search, page = 1, pageSize = 10 } = options;
  const where: Prisma.ConversationWhereInput = {
    feedbackPoint: { spaceId },
    ...(locationId ? { feedbackPointId: locationId } : {}),
    ...(search ? { customerName: { contains: search, mode: "insensitive" } } : {}),
  };
  if (sentiment === "PENDING") {
    where.AND = [{ analysis: { is: null } }, { legacySummary: { is: null } }];
  } else if (sentiment) {
    where.OR = [
      { analysis: { is: { sentiment } } },
      { AND: [{ analysis: { is: null } }, { legacySummary: { is: { sentiment } } }] },
    ];
  }
  const [rows, total] = await Promise.all([prisma.conversation.findMany({
    where,
    select: {
      id: true,
      customerName: true,
      status: true,
      analysisStatus: true,
      createdAt: true,
      feedbackPoint: { select: { name: true } },
      legacySummary: { select: { summary: true, sentiment: true } },
      analysis: {
        select: {
          summary: true,
          sentiment: true,
          findings: { select: { id: true, kind: true, label: true }, orderBy: { createdAt: "asc" }, take: 3 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  }), prisma.conversation.count({ where })]);
  const totalPages = Math.ceil(total / pageSize);
  return {
    sessions: rows,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getSpaceInsights(spaceId: string) {
  return prisma.insight.findMany({
    where: { spaceId, active: true },
    orderBy: [{ type: "asc" }, { evidenceCount: "desc" }],
    take: 12,
  });
}
