import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireDbUser } from "@/lib/auth";

export async function requireOnboardedBusiness() {
  const { dbUser } = await requireDbUser();

  const business = await prisma.business.findFirst({
    where: { ownerId: dbUser.id },
    include: { locations: true },
  });

  if (!business || !business.onboardingCompletedAt) {
    redirect("/dashboard/onboarding");
  }

  return { dbUser, business };
}

