import { describe, expect, it } from "vitest";
import { parseKiriPageContext } from "./kiri-context";

describe("parseKiriPageContext", () => {
  it("accepts and normalizes an authorized context", () => {
    expect(parseKiriPageContext({
      view: "insight",
      accountId: "account-1",
      spaceId: "space-1",
      insightId: "insight-1",
      dateRange: { from: "2026-01-01", to: "2026-01-31" },
    }, "account-1")).toEqual({
      view: "insight",
      accountId: "account-1",
      spaceId: "space-1",
      insightId: "insight-1",
      dateRange: { from: "2026-01-01T00:00:00.000Z", to: "2026-01-31T00:00:00.000Z" },
    });
  });

  it("rejects another account and unknown views", () => {
    expect(parseKiriPageContext({ view: "overview", accountId: "account-2" }, "account-1")).toBeNull();
    expect(parseKiriPageContext({ view: "admin", accountId: "account-1" }, "account-1")).toBeNull();
  });

  it("drops oversized ids and invalid ranges", () => {
    expect(parseKiriPageContext({
      view: "kiri",
      accountId: "account-1",
      entityId: "x".repeat(129),
      dateRange: { from: "later", to: "earlier" },
    }, "account-1")).toEqual({ view: "kiri", accountId: "account-1" });
  });
});
