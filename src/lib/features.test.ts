import { afterEach, describe, expect, it } from "vitest";
import { featureEnabled } from "./features";

describe("featureEnabled", () => {
  afterEach(() => delete process.env.FEATURE_KIRI);

  it("defaults new releases on", () => {
    expect(featureEnabled("kiri")).toBe(true);
  });

  it("recognizes a case-insensitive false kill switch", () => {
    process.env.FEATURE_KIRI = "FALSE";
    expect(featureEnabled("kiri")).toBe(false);
  });
});
