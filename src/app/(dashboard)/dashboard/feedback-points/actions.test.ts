import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  context: vi.fn(), transaction: vi.fn(), lock: vi.fn(), count: vi.fn(),
  create: vi.fn(), updateMany: vi.fn(), revalidate: vi.fn(), redirect: vi.fn(),
}));
vi.mock("@/lib/business", () => ({ requireOnboardedSpace: mocks.context }));
vi.mock("@/lib/db", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
import { saveFeedbackPoint } from "./actions";

function data() {
  const form = new FormData();
  for (const [key, value] of Object.entries({ name: "Sports site", businessType: "Website", description: "A home for sports fans.", agentPersona: "DEREK", goal: "How easy is it to find the scores?" })) form.set(key, value);
  return form;
}
describe("saving feedback points", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.context.mockResolvedValue({ account: { id: "account-a", plan: "STARTER" }, space: { id: "space-a" }, membership: { role: "OWNER" } });
    mocks.transaction.mockImplementation(async (callback) => callback({ $queryRaw: mocks.lock, feedbackPoint: { count: mocks.count, create: mocks.create, updateMany: mocks.updateMany } }));
    mocks.count.mockResolvedValue(4);
    mocks.create.mockResolvedValue({ id: "new-point" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.redirect.mockImplementation((path) => { throw new Error(`redirect:${path}`); });
  });
  it("creates the fifth point with an independent brief and account-wide allowance", async () => {
    await expect(saveFeedbackPoint(null, {}, data())).rejects.toThrow("redirect:/dashboard/feedback-points?saved=new-point");
    expect(mocks.lock.mock.invocationCallOrder[0]).toBeLessThan(mocks.count.mock.invocationCallOrder[0]);
    expect(mocks.count).toHaveBeenCalledWith({ where: { space: { accountId: "account-a" } } });
    expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({ spaceId: "space-a", agentPersona: "DEREK", goals: ["How easy is it to find the scores?"] }) });
  });
  it("rejects a sixth point at the server", async () => {
    mocks.count.mockResolvedValue(5);
    expect(await saveFeedbackPoint(null, {}, data())).toEqual({ error: expect.stringContaining("5 feedback points") });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("allows edits at the limit, preserves the slug, and scopes updates to the owner", async () => {
    mocks.count.mockResolvedValue(5);
    await expect(saveFeedbackPoint("point-a", {}, data())).rejects.toThrow("saved=point-a");
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.updateMany).toHaveBeenCalledWith({ where: { id: "point-a", spaceId: "space-a", space: { accountId: "account-a" } }, data: expect.not.objectContaining({ slug: expect.anything() }) });
  });
  it("does not save a point belonging to another account", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    expect(await saveFeedbackPoint("foreign-point", {}, data())).toEqual({ error: expect.stringContaining("no longer available") });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("does not allow a member to change agent settings", async () => {
    mocks.context.mockResolvedValue({ account: {}, space: {}, membership: { role: "MEMBER" } });
    expect(await saveFeedbackPoint(null, {}, data())).toEqual({ error: expect.stringContaining("owners and admins") });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("returns field errors without writing invalid data", async () => {
    const form = data(); form.delete("goal");
    expect(await saveFeedbackPoint(null, {}, form)).toEqual(expect.objectContaining({ fields: { goals: expect.any(String) } }));
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("returns a recoverable error when persistence fails", async () => {
    mocks.transaction.mockRejectedValue(new Error("database unavailable"));
    const logging = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await saveFeedbackPoint(null, {}, data())).toEqual({ error: expect.stringContaining("edits are still here") });
    expect(mocks.redirect).not.toHaveBeenCalled();
    logging.mockRestore();
  });
});
