import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export function createConversationCredential() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashCredential(token) };
}

export function hashCredential(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function readBearerToken(request: Request) {
  const header = request.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

export function credentialMatches(token: string, expectedHash: string | null) {
  if (!token || !expectedHash) return false;
  const actual = Buffer.from(hashCredential(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function checkRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = request.headers.get("cf-connecting-ip") || forwarded || "unknown";
  const key = createHash("sha256").update(`${scope}:${ip}`).digest("hex");
  const now = new Date();
  const nextReset = new Date(now.getTime() + windowMs);
  const [window] = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>(Prisma.sql`
    INSERT INTO "RateLimitWindow" ("key", "count", "resetAt", "updatedAt")
    VALUES (${key}, 1, ${nextReset}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitWindow"."resetAt" <= ${now} THEN 1 ELSE "RateLimitWindow"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimitWindow"."resetAt" <= ${now} THEN ${nextReset} ELSE "RateLimitWindow"."resetAt" END,
      "updatedAt" = ${now}
    RETURNING "count", "resetAt"
  `);
  return {
    allowed: window.count <= limit,
    remaining: Math.max(0, limit - window.count),
    ...(window.count > limit ? { retryAfter: window.resetAt } : {}),
  };
}
