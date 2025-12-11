import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./db";

export async function requireDbUser() {
  const user = await currentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    "";

  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: { email },
    create: { clerkId: user.id, email },
  });

  return { user, dbUser };
}

