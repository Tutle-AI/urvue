import { describe, expect, it } from "vitest";
import { createConversationCredential, credentialMatches, hashCredential, readBearerToken } from "./conversation-security";

describe("conversation credentials", () => {
  it("stores a hash and validates only the original token", () => {
    const credential = createConversationCredential();
    expect(credential.hash).toBe(hashCredential(credential.token));
    expect(credential.hash).not.toContain(credential.token);
    expect(credentialMatches(credential.token, credential.hash)).toBe(true);
    expect(credentialMatches("wrong-token", credential.hash)).toBe(false);
  });

  it("reads bearer credentials without accepting other schemes", () => {
    expect(readBearerToken(new Request("https://urvue.test", { headers: { authorization: "Bearer secret" } }))).toBe("secret");
    expect(readBearerToken(new Request("https://urvue.test", { headers: { authorization: "Basic secret" } }))).toBe("");
  });
});
