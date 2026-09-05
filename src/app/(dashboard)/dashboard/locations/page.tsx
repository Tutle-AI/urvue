import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { uniqueLocationSlug } from "@/lib/unique-slug";
import { requireOnboardedSpace } from "@/lib/business";
import { getLocationStats } from "@/lib/stats";
import { LocationCard } from "./location-card";

async function addFeedbackPoint(formData: FormData) {
  "use server";
  const name = formData.get("name")?.toString().trim().slice(0, 120);
  if (!name) return;
  const { space } = await requireOnboardedSpace();
  await prisma.feedbackPoint.create({
    data: { spaceId: space.id, name, slug: await uniqueLocationSlug(`${space.slug}-${slugify(name)}`) },
  });
  revalidatePath("/dashboard/locations");
}

export default async function FeedbackPointsPage() {
  const { space } = await requireOnboardedSpace();
  const points = await getLocationStats(space.id);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.urvue.app";
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-sm text-primary">Listen in different moments</p><h1 className="mt-1 font-serif text-4xl text-foreground">Feedback Points</h1><p className="mt-2 text-sm text-muted">Each link or QR identifies where the customer entered while contributing to {space.name}’s shared intelligence.</p></div>
        <form action={addFeedbackPoint} className="flex gap-2"><input name="name" required placeholder="e.g., Receipt QR" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground sm:w-52" /><button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white">Add point</button></form>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{points.map((point) => <LocationCard key={point.id} location={point} baseUrl={baseUrl} />)}</div>
      <div className="rounded-2xl border border-border bg-card p-5"><h2 className="font-medium text-foreground">Good Feedback Points are specific</h2><p className="mt-2 text-sm leading-relaxed text-muted">Use separate points for a receipt, table, checkout, support page, redesign, or campaign. UrVue keeps the source visible without fragmenting the Space’s customer intelligence.</p></div>
    </div>
  );
}
