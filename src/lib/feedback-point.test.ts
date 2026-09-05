import { describe, expect, it } from "vitest";
import { conversationBrief, feedbackPointSchema, pointBrief, pointContext, pointLimit, type PointBrief } from "./feedback-point";

const sports: PointBrief = { name: "Courtside", businessType: "Website", description: "Live scores for basketball fans.", goals: ["How easy is it to find your team?"], agentPersona: "DEREK" };
const clothing: PointBrief = { name: "Thread", businessType: "Retail", description: "Clothing and shoes for everyday adventures.", goals: ["Was the sizing guide helpful?"], agentPersona: "PROFESSIONAL" };

describe("independent feedback point briefs", () => {
  it("keeps a point's context and goals isolated from another point", () => {
    expect(pointContext(sports)).toContain("find your team");
    expect(pointContext(sports)).not.toContain("sizing");
    expect(pointContext(clothing)).not.toContain("basketball");
  });
  it("preserves the conversation's original brief after the owner edits the point", () => {
    const snapshot = pointBrief(sports);
    expect(conversationBrief(clothing, snapshot)).toEqual(sports);
    expect(conversationBrief(clothing, null)).toEqual(clothing);
  });
  it("does not share a mutable goals array with a saved snapshot", () => {
    const point = { ...sports, goals: [...sports.goals] };
    const snapshot = pointBrief(point);
    point.goals.push("Another goal");
    expect(snapshot.goals).toHaveLength(1);
  });
  it("accepts migrated briefs with no goals or description without falling back to edited values", () => {
    const legacy = { ...sports, description: "", goals: [] };
    expect(conversationBrief(clothing, legacy)).toEqual(legacy);
  });
  it("preserves punctuation inside an individual goal", () => {
    const goals = ["Did navigation, search, and filters help; if not, why?"];
    expect(feedbackPointSchema.parse({ ...sports, goals }).goals).toEqual(goals);
  });
  it.each([
    { name: " " }, { description: "short" }, { businessType: "" },
    { goals: [] }, { goals: [" "] }, { goals: Array(13).fill("A goal") },
    { goals: ["a".repeat(301)] }, { agentPersona: "UNRECOGNIZED" },
  ])("rejects incomplete or oversized input: %j", (override) => {
    expect(feedbackPointSchema.safeParse({ ...sports, ...override }).success).toBe(false);
  });
  it("includes five feedback points in Basic", () => expect(pointLimit("STARTER")).toBe(5));
});
