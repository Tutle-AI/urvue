import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getPrimarySpace, requireAccountContext } from "@/lib/business";
import { featureEnabled } from "@/lib/features";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  const { account } = await requireAccountContext();

  let businessName = "";
  let locations: { id: string; name: string; slug: string }[] = [];
  let kiriContext: { accountId: string; spaceId: string } | undefined;

  {
    const space = await getPrimarySpace(account.id);

    if (space) {
      businessName = space.name;
      locations = space.feedbackPoints;
      if (space.accountId && featureEnabled("kiri")) kiriContext = { accountId: space.accountId, spaceId: space.id };
    }
  }

  return (
    <DashboardShell businessName={businessName} locations={locations} kiriContext={kiriContext}>
      {children}
    </DashboardShell>
  );
}

