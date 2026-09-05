import { beforeEach, describe, expect, it, vi } from "vitest";

const { conversation, intelligenceJob, transaction, respond } = vi.hoisted(() => ({
  conversation: {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  intelligenceJob: { upsert: vi.fn() },
  transaction: vi.fn(),
  respond: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { conversation, intelligenceJob, $transaction: transaction },
}));
vi.mock("@/lib/openai", () => ({
  openai: { responses: { create: respond } },
  summaryModel: "test-model",
}));

describe("conversation analysis", () => {
  beforeEach(() => {
    conversation.findUnique.mockReset();
    conversation.update.mockReset();
    conversation.updateMany.mockReset();
    intelligenceJob.upsert.mockReset();
    transaction.mockReset();
    respond.mockReset();
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

  it("analyzes against the conversation's saved point goals instead of later edits or workspace defaults", async () => {
    const original = { name: "Courtside", businessType: "Website", description: "Basketball scores and recaps.", goals: ["Can fans find their teams?"], agentPersona: "DEREK" };
    conversation.findUnique.mockResolvedValue({
      id: "conversation-1", closedAt: new Date(), interviewConfig: original,
      feedbackPoint: { ...original, goals: ["Are shoes comfortable?"], space: { id: "space-1", description: "A clothing retailer", goals: [{ label: "Clothing quality" }] } },
      messages: [{ id: "customer-1", role: "CUSTOMER", content: "I couldn't find my team's scores." }],
    });
    respond.mockResolvedValue({ output_text: JSON.stringify({ summary: "Scores were difficult to find.", sentiment: "NEGATIVE", findings: [] }) });
    transaction.mockImplementation(async (callback) => callback({
      conversationAnalysis: { upsert: vi.fn().mockResolvedValue({ id: "analysis-1" }) },
      analysisFinding: { deleteMany: vi.fn() }, conversation,
    }));
    intelligenceJob.upsert.mockResolvedValue({ id: "job-1" });
    const { analyzeConversation } = await import("./intelligence");
    await expect(analyzeConversation("conversation-1")).resolves.toEqual({ status: "complete" });
    const prompt = JSON.stringify(respond.mock.calls[0][0].input);
    expect(prompt).toContain("Can fans find their teams?");
    expect(prompt).not.toContain("shoes");
    expect(prompt).not.toContain("clothing");
  });
});
