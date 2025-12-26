import { prisma } from "./db";

export type BusinessStats = {
  totalSessions: number;
  activeSessions: number;
  summarizedSessions: number;
  avgScore: number | null;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
    pending: number;
  };
  thisWeekSessions: number;
  lastWeekSessions: number;
};

export type SentimentTrendPoint = {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
};

export type LocationStat = {
  id: string;
  name: string;
  slug: string;
  sessionCount: number;
  lastActivity: Date | null;
};

export async function getBusinessStats(businessId: string): Promise<BusinessStats> {
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  // Get all sessions for this business
  const sessions = await prisma.feedbackSession.findMany({
    where: { location: { businessId } },
    include: { summary: true },
  });

  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.status === "ACTIVE").length;
  const summarizedSessions = sessions.filter((s) => s.summary).length;

  // Calculate sentiment breakdown
  const summaries = sessions.map((s) => s.summary).filter(Boolean);
  const positive = summaries.filter((s) => s?.sentiment === "POSITIVE").length;
  const neutral = summaries.filter((s) => s?.sentiment === "NEUTRAL").length;
  const negative = summaries.filter((s) => s?.sentiment === "NEGATIVE").length;
  const pending = totalSessions - summaries.length;

  // Average score
  const scores = summaries.map((s) => s?.score).filter((s): s is number => s !== null);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  // This week vs last week
  const thisWeekSessions = sessions.filter(
    (s) => s.createdAt >= startOfThisWeek
  ).length;
  const lastWeekSessions = sessions.filter(
    (s) => s.createdAt >= startOfLastWeek && s.createdAt < startOfThisWeek
  ).length;

  return {
    totalSessions,
    activeSessions,
    summarizedSessions,
    avgScore,
    sentimentBreakdown: { positive, neutral, negative, pending },
    thisWeekSessions,
    lastWeekSessions,
  };
}

export async function getSentimentTrend(
  businessId: string,
  days: number = 30
): Promise<SentimentTrendPoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const sessions = await prisma.feedbackSession.findMany({
    where: {
      location: { businessId },
      createdAt: { gte: startDate },
    },
    include: { summary: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const dateMap = new Map<string, { positive: number; neutral: number; negative: number }>();

  // Initialize all dates
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const key = date.toISOString().split("T")[0];
    dateMap.set(key, { positive: 0, neutral: 0, negative: 0 });
  }

  // Count sessions by sentiment
  for (const session of sessions) {
    const key = session.createdAt.toISOString().split("T")[0];
    const entry = dateMap.get(key);
    if (entry) {
      const sentiment = session.summary?.sentiment;
      if (sentiment === "POSITIVE") entry.positive++;
      else if (sentiment === "NEGATIVE") entry.negative++;
      else entry.neutral++;
    }
  }

  return Array.from(dateMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));
}

export async function getLocationStats(businessId: string): Promise<LocationStat[]> {
  const locations = await prisma.location.findMany({
    where: { businessId },
    include: {
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
      _count: {
        select: { sessions: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    slug: loc.slug,
    sessionCount: loc._count.sessions,
    lastActivity: loc.sessions[0]?.createdAt ?? null,
  }));
}

export async function getRecentSessions(businessId: string, limit: number = 5) {
  return prisma.feedbackSession.findMany({
    where: { location: { businessId } },
    include: {
      location: true,
      summary: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getSessionsWithFilters(
  businessId: string,
  options: {
    locationId?: string;
    sentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "PENDING";
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const { locationId, sentiment, search, page = 1, pageSize = 10 } = options;

  // Build where clause
  const where = {
    location: { businessId },
    ...(locationId && { locationId }),
    ...(search && { customerName: { contains: search, mode: "insensitive" as const } }),
  };

  // Get sessions with summary info
  const allSessions = await prisma.feedbackSession.findMany({
    where,
    include: {
      location: true,
      summary: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter by sentiment (including "PENDING" for sessions without summary)
  let filtered = allSessions;
  if (sentiment) {
    if (sentiment === "PENDING") {
      filtered = allSessions.filter((s) => !s.summary);
    } else {
      filtered = allSessions.filter((s) => s.summary?.sentiment === sentiment);
    }
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const sessions = filtered.slice(start, start + pageSize);

  return {
    sessions,
    total,
    page,
    pageSize,
    totalPages,
  };
}
