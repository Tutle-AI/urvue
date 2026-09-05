import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ find: vi.fn(), update: vi.fn(), create: vi.fn(), close: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { conversation: { findUnique: mocks.find }, $transaction: (run: (tx: unknown) => unknown) => run({ conversation: { updateMany: mocks.update }, conversationMessage: { create: mocks.create } }) } }));
vi.mock("@/lib/conversation-security", () => ({ credentialMatches: (_: unknown, hash: string) => hash === "valid", readBearerToken: () => "token" }));
vi.mock("@/lib/intelligence", () => ({ closeConversationAndEnqueueAnalysis: mocks.close, processIntelligenceJob: vi.fn() }));
vi.mock("next/server", async (original) => ({ ...await original<typeof import("next/server")>(), after: vi.fn() }));
import { POST } from "@/app/api/public/conversations/[id]/close/route";

describe("visitor Finish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.update.mockResolvedValue({ count: 1 });
    mocks.close.mockResolvedValue({ id: "job" });
  });
  it.each([0, 2])("closes with a saved goodbye after %s visitor messages", async (count) => {
    mocks.find.mockResolvedValue({ accessTokenHash: "valid", status: "ACTIVE", analysisStatus: "PENDING", feedbackPoint: { spaceId: "space" }, _count: { messages: count } });
    const response = await POST(new Request("http://localhost/api", { method: "POST" }), { params: Promise.resolve({ id: "conversation" }) });
    const body = await response.json();
    expect(response.ok).toBe(true);
    expect(body.reply).toContain("Take care!");
    expect(mocks.create).toHaveBeenCalledWith({ data: { conversationId: "conversation", role: "ASSISTANT", content: body.reply } });
    expect(mocks.close).toHaveBeenCalledTimes(count ? 1 : 0);
    expect(body.analysisStatus).toBe(count ? "PENDING" : "SKIPPED");
  });
  it("does not add duplicate farewells on a repeated Finish", async () => {
    mocks.find.mockResolvedValue({ accessTokenHash: "valid", status: "CLOSED", analysisStatus: "COMPLETE", feedbackPoint: { spaceId: "space" }, _count: { messages: 2 } });
    mocks.update.mockResolvedValue({ count: 0 });
    await POST(new Request("http://localhost/api", { method: "POST" }), { params: Promise.resolve({ id: "conversation" }) });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.close).not.toHaveBeenCalled();
  });
  it("rejects an invalid credential without changing the conversation", async () => {
    mocks.find.mockResolvedValue({ accessTokenHash: "invalid" });
    const response = await POST(new Request("http://localhost/api", { method: "POST" }), { params: Promise.resolve({ id: "conversation" }) });
    expect(response.status).toBe(404);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
