import { describe, expect, it } from "vitest";
import { AgentPersona } from "@prisma/client";
import { interviewSystemPrompt, openingMessage, PERSONAS } from "./interview";

describe("customer interviewer", () => {
  it.each(Object.values(AgentPersona))("keeps the shared interview policy for %s", (persona) => {
    const prompt = interviewSystemPrompt(persona);
    expect(prompt).toContain(PERSONAS[persona].name);
    expect(prompt).toContain("one targeted follow-up");
    expect(prompt).toContain("never recite a checklist");
  });

  it("creates a named, contextual greeting", () => {
    expect(openingMessage({ persona: "AMANDA", customerName: "Sam", spaceName: "Northside", feedbackPointName: "Receipt QR" })).toContain("Hi Sam, I’m Amanda");
  });
});
