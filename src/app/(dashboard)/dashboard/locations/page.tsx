import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { uniqueLocationSlug } from "@/lib/unique-slug";
import { requireOnboardedBusiness } from "@/lib/business";
import { maxLocationsForPlan } from "@/lib/plan";
import { getLocationStats } from "@/lib/stats";
import { LocationCard } from "./location-card";

async function addLocation(formData: FormData) {
  "use server";
  const name = formData.get("name")?.toString().trim();
  if (!name) return;

  const { business } = await requireOnboardedBusiness();
  const used = await prisma.location.count({ where: { businessId: business.id } });
  const limit = maxLocationsForPlan(business.plan);
  if (used >= limit) {
    return;
  }

  const slug = await uniqueLocationSlug(slugify(name));
  await prisma.location.create({
    data: { businessId: business.id, name, slug },
  });

  revalidatePath("/dashboard/locations");
  revalidatePath("/dashboard");
}

export default async function LocationsPage() {
  const { business } = await requireOnboardedBusiness();
  const limit = maxLocationsForPlan(business.plan);
  const locationStats = await getLocationStats(business.id);
  const used = locationStats.length;
  const canAddLocation = used < limit;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.urvue.app";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Locations
          </h1>
          <p className="mt-1 text-sm text-muted">
            Create QR codes and links for each location
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs text-muted">
            <span
              className={`h-2 w-2 rounded-full ${
                canAddLocation ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            {used}/{limit} locations used
          </div>
        </div>

        {/* Add location form */}
        <form action={addLocation} className="flex gap-2">
          <input
            name="name"
            placeholder="New location name"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50 disabled:opacity-50 sm:w-48"
            disabled={!canAddLocation}
            required
          />
          <button
            type="submit"
            disabled={!canAddLocation}
            className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
          >
            Add
          </button>
        </form>
      </div>

      {/* Limit warning */}
      {!canAddLocation && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-foreground">
          <strong>Location limit reached.</strong> Upgrade to{" "}
          {business.plan === "STARTER" ? "Pro" : "Enterprise"} to add more
          locations.
        </div>
      )}

      {/* Locations grid */}
      {locationStats.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-surface flex items-center justify-center">
            <svg
              className="h-6 w-6 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="mt-4 font-medium text-foreground">No locations yet</h3>
          <p className="mt-1 text-sm text-muted">
            Add your first location to start collecting feedback
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locationStats.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              baseUrl={baseUrl}
            />
          ))}
        </div>
      )}

      {/* Tips section */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-medium text-foreground">Tips for collecting feedback</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            Print QR codes and place them at checkout, tables, or reception
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            Add the feedback link to receipts or follow-up emails
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            Create separate locations for different branches or service areas
          </li>
        </ul>
      </div>
    </div>
  );
}
