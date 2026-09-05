import { beforeEach, describe, expect, it, vi } from "vitest";

const { conversation, intelligenceJob, transaction } = vi.hoisted(() => ({
  conversation: {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  intelligenceJob: { upsert: vi.fn() },
  transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { conversation, intelligenceJob, $transaction: transaction },
}));
vi.mock("@/lib/openai", () => ({
  openai: { responses: { create: vi.fn() } },
  summaryModel: "test-model",
}));

describe("conversation analysis", () => {
  beforeEach(() => {
    conversation.findUnique.mockReset();
    conversation.update.mockReset();
    conversation.updateMany.mockReset();
    intelligenceJob.upsert.mockReset();
    transaction.mockReset();
  });

  it("skips an empty conversation instead of retrying it", async () => {
    conversation.findUnique.mockResolvedValue({
      id: "conversation-1",
      status: "ACTIVE",
      closedAt: null,
      messages: [{ id: "opening", role: "ASSISTANT", content: "How was it?" }],
      feedbackPoint: { name: "Receipt", space: { id: "space-1" } },
    });
    conversation.update.mockResolvedValue({});
    const { analyzeConversation } = await import("./intelligence");
    await expect(analyzeConversation("conversation-1")).resolves.toEqual({ status: "skipped" });
    expect(conversation.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ analysisStatus: "SKIPPED", status: "CLOSED" }),
    }));
  });

  it("closes and enqueues analysis in one database transaction", async () => {
    const closedAt = new Date("2026-09-04T12:00:00.000Z");
    transaction.mockImplementation(async (callback) => callback({ conversation, intelligenceJob }));
    conversation.update.mockResolvedValue({});
    intelligenceJob.upsert.mockResolvedValue({ id: "job-1" });
    const { closeConversationAndEnqueueAnalysis } = await import("./intelligence");

    await expect(closeConversationAndEnqueueAnalysis("conversation-1", "space-1", closedAt)).resolves.toEqual({ id: "job-1" });
    expect(conversation.update).toHaveBeenCalledWith({
      where: { id: "conversation-1" },
      data: { status: "CLOSED", closedAt },
    });
    expect(intelligenceJob.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { dedupeKey: "analyze:conversation-1:v2" },
    }));
  });
});
