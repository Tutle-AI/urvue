import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";
import { prisma } from "./db";

export const requireDbUser = cache(async function requireDbUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) return { dbUser: existing };

  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    "";

  const dbUser = await prisma.user.upsert({
    where: { clerkId: userId },
    update: { email },
    create: { clerkId: userId, email },
  });

  return { dbUser };
});

