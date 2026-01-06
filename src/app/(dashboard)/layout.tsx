import { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { prisma } from "@/lib/db";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  // Fetch business data for the top bar
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
  });

  let businessName = "";
  let locations: { id: string; name: string; slug: string }[] = [];

  if (dbUser) {
    const business = await prisma.business.findFirst({
      where: { ownerId: dbUser.id },
      include: {
        locations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (business) {
      businessName = business.name;
      locations = business.locations;
    }
  }

  return (
    <DashboardShell businessName={businessName} locations={locations}>
      {children}
    </DashboardShell>
  );
}

