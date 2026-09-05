import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireDbUser } from "@/lib/auth";
import { cache } from "react";

export async function ensureAccountForUser(dbUser: { id: string; email: string }) {
  const existing = await prisma.accountMembership.findFirst({
    where: { userId: dbUser.id },
    include: { account: true },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing.account;

  const legacySpaces = await prisma.space.findMany({
    where: { ownerId: dbUser.id },
    orderBy: { createdAt: "asc" },
  });
  const source = legacySpaces[0];
  const fallbackName = dbUser.email.split("@")[0] || "My UrVue account";

  return prisma.$transaction(async (tx) => {
    const raced = await tx.accountMembership.findFirst({
      where: { userId: dbUser.id },
      include: { account: true },
    });
    if (raced) return raced.account;

    const account = await tx.account.create({
      data: {
        name: source?.name || fallbackName,
        plan: source?.plan || "STARTER",
        stripeCustomerId: source?.stripeCustomerId || null,
        stripeSubscriptionId: source?.stripeSubscriptionId || null,
        trialEndsAt: source?.trialEndsAt || null,
        memberships: { create: { userId: dbUser.id, role: "OWNER" } },
      },
    });
    if (legacySpaces.length) {
      await tx.space.updateMany({
        where: { ownerId: dbUser.id, accountId: null },
        data: { accountId: account.id },
      });
    }
    return account;
  });
}

export const requireAccountContext = cache(async function requireAccountContext() {
  const { dbUser } = await requireDbUser();
  const existing = await prisma.accountMembership.findFirst({
    where: { userId: dbUser.id },
    include: { account: true },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return { dbUser, account: existing.account, membership: existing };
  const account = await ensureAccountForUser(dbUser);
  const membership = await prisma.accountMembership.findUnique({
    where: { accountId_userId: { accountId: account.id, userId: dbUser.id } },
  });
  if (!membership) throw new Error("Unauthorized");
  return { dbUser, account, membership };
});

export const getPrimarySpace = cache(async function getPrimarySpace(accountId: string) {
  return prisma.space.findFirst({
    where: { accountId },
    include: {
      feedbackPoints: { where: { active: true }, orderBy: { createdAt: "asc" } },
      goals: { where: { active: true }, orderBy: { priority: "asc" } },
      trackedEntities: { where: { active: true }, orderBy: { name: "asc" } },
      businessChanges: { where: { status: { in: ["PLANNED", "ACTIVE"] } } },
    },
    orderBy: { createdAt: "asc" },
  });
});

export const requireOnboardedSpace = cache(async function requireOnboardedSpace() {
  const { dbUser, account, membership } = await requireAccountContext();
  const space = await getPrimarySpace(account.id);
  if (!space?.onboardingCompletedAt) redirect("/dashboard/onboarding");
  return { dbUser, account, membership, space };
});

export async function requireOnboardedBusiness() {
  const context = await requireOnboardedSpace();
  return { ...context, business: context.space };
}
