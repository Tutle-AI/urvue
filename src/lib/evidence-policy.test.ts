import { describe, expect, it } from "vitest";
import { canComparePeriods, canRankStaff, patternStrengthFor } from "./evidence-policy";

describe("evidence policy", () => {
  it.each([
    [0, "ISOLATED"],
    [1, "ISOLATED"],
    [2, "EMERGING"],
    [4, "EMERGING"],
    [5, "ESTABLISHED"],
  ])("classifies %i conversations as %s", (count, expected) => {
    expect(patternStrengthFor(count)).toBe(expected);
  });

  it("requires five analyzed conversations on both sides of a comparison", () => {
    expect(canComparePeriods(5, 5)).toBe(true);
    expect(canComparePeriods(5, 4)).toBe(false);
  });

  it("does not rank staff below eight distinct conversations", () => {
    expect(canRankStaff(7)).toBe(false);
    expect(canRankStaff(8)).toBe(true);
  });
});
