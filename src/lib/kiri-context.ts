export type KiriPageContext = {
  view: "overview" | "conversations" | "conversation" | "insight" | "feedback-points" | "settings" | "kiri";
  accountId: string;
  spaceId?: string;
  feedbackPointId?: string;
  insightId?: string;
  conversationId?: string;
  entityId?: string;
  dateRange?: { from: string; to: string };
};

const views = new Set<KiriPageContext["view"]>([
  "overview",
  "conversations",
  "conversation",
  "insight",
  "feedback-points",
  "settings",
  "kiri",
]);

function boundedId(value: unknown) {
  return typeof value === "string" && value.length > 0 && value.length <= 128 ? value : undefined;
}

export function parseKiriPageContext(input: unknown, accountId: string): KiriPageContext | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  if (value.accountId !== accountId || typeof value.view !== "string" || !views.has(value.view as KiriPageContext["view"])) return null;

  const context: KiriPageContext = { view: value.view as KiriPageContext["view"], accountId };
  for (const key of ["spaceId", "feedbackPointId", "insightId", "conversationId", "entityId"] as const) {
    const id = boundedId(value[key]);
    if (id) context[key] = id;
  }
  if (value.dateRange && typeof value.dateRange === "object") {
    const range = value.dateRange as Record<string, unknown>;
    const from = typeof range.from === "string" ? new Date(range.from) : null;
    const to = typeof range.to === "string" ? new Date(range.to) : null;
    if (from && to && Number.isFinite(from.getTime()) && Number.isFinite(to.getTime()) && from <= to) {
      context.dateRange = { from: from.toISOString(), to: to.toISOString() };
    }
  }
  return context;
}
