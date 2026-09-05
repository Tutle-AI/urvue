import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ point: vi.fn(), conversation: vi.fn(), createConversation: vi.fn(), createMessage: vi.fn(), respond: vi.fn(), close: vi.fn() }));
vi.mock("next/server", async (original) => ({ ...await original<typeof import("next/server")>(), after: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { feedbackPoint: { findUnique: mocks.point }, conversation: { findUnique: mocks.conversation, create: mocks.createConversation }, conversationMessage: { create: mocks.createMessage } } }));
vi.mock("@/lib/conversation-security", () => ({ checkRateLimit: async () => ({ allowed: true }), credentialMatches: () => true, readBearerToken: () => "token", createConversationCredential: () => ({ hash: "hash", token: "token" }) }));
vi.mock("@/lib/openai", () => ({ openai: { responses: { create: mocks.respond } }, feedbackModel: "gpt-5.6-luna" }));
vi.mock("@/lib/intelligence", () => ({ closeConversationAndEnqueueAnalysis: mocks.close, processIntelligenceJob: vi.fn() }));
import { POST as start } from "@/app/api/public/feedback-points/[slug]/conversations/route";
import { POST as legacyStart } from "@/app/api/feedback/session/route";
import { POST as message } from "@/app/api/public/conversations/[id]/messages/route";

const brief = { name: "Courtside", businessType: "Website", description: "A sports site for basketball fans.", goals: ["Can fans find their team?"], agentPersona: "DEREK" };
const space = { id: "workspace", name: "Clothing business", description: "Clothes for everyone", goals: [{ label: "Are the clothes comfortable?" }], businessType: "Retail", agentPersona: "AMANDA", trackedEntities: [], businessChanges: [] };
describe("public interviews use point configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.close.mockResolvedValue({ id: "job" });
    mocks.point.mockResolvedValue({ ...brief, id: "point", active: true, space });
    mocks.createConversation.mockResolvedValue({ id: "conversation" });
    mocks.createMessage.mockResolvedValue({ content: "Finding scores was difficult." });
    mocks.respond.mockResolvedValue({ output_text: JSON.stringify({ reply: "What made the scores difficult to find?", finalize: false }) });
  });
  it.each([0, 19])("saves a farewell when the model closes or the message limit is reached (%s)", async (count) => {
    mocks.conversation.mockResolvedValue({ id: "conversation", accessTokenHash: "hash", status: "ACTIVE", interviewConfig: brief, feedbackPoint: { ...brief, space }, messages: [], _count: { messages: count } });
    mocks.respond.mockResolvedValue({ output_text: JSON.stringify({ reply: "What else could improve?", finalize: count === 0 }) });
    const response = await message(new Request("http://localhost/api", { method: "POST", body: JSON.stringify({ message: "That's all." }) }), { params: Promise.resolve({ id: "conversation" }) });
    const body = await response.json();
    expect(body.finalize).toBe(true);
    expect(body.reply).toContain("Thank you for your time");
    expect(body.reply).toContain("Take care!");
    expect(body.reply).not.toContain("?");
    expect(mocks.createMessage).toHaveBeenLastCalledWith({ data: { conversationId: "conversation", role: "ASSISTANT", content: body.reply } });
    expect(mocks.close).toHaveBeenCalledOnce();
    expect(mocks.respond.mock.calls[0][0]).toMatchObject({ model: "gpt-5.6-luna", reasoning: { effort: "none" } });
  });
  it("starts with the point's personality and saves its complete brief", async () => {
    const response = await start(new Request("http://localhost/api", { method: "POST", body: "{}" }), { params: Promise.resolve({ slug: "courtside" }) });
    const body = await response.json();
    expect(body.greeting).toContain("Derek");
    expect(body.greeting).not.toContain("Clothing");
    expect(mocks.createConversation).toHaveBeenCalledWith({ data: expect.objectContaining({ interviewConfig: brief }) });
  });
  it("uses the same independent brief through the legacy start endpoint", async () => {
    const response = await legacyStart(new Request("http://localhost/api", { method: "POST", body: JSON.stringify({ slug: "courtside" }) }));
    expect((await response.json()).greeting).toContain("Derek");
    expect(mocks.createConversation).toHaveBeenCalledWith({ data: expect.objectContaining({ interviewConfig: brief }) });
  });
  it("continues using the original goals and persona even after a point is edited", async () => {
    mocks.conversation.mockResolvedValue({ id: "conversation", accessTokenHash: "hash", status: "ACTIVE", interviewConfig: brief, feedbackPoint: { ...brief, agentPersona: "DIRECT", goals: ["Are the shoes comfortable?"], space }, messages: [], _count: { messages: 1 } });
    const response = await message(new Request("http://localhost/api", { method: "POST", body: JSON.stringify({ message: "Finding scores was difficult." }) }), { params: Promise.resolve({ id: "conversation" }) });
    expect(response.status).toBe(200);
    const request = JSON.stringify(mocks.respond.mock.calls[0][0].input);
    expect(request).toContain("Derek");
    expect(request).toContain("Can fans find their team?");
    expect(request).not.toContain("clothes");
    expect(request).not.toContain("shoes");
  });
});
