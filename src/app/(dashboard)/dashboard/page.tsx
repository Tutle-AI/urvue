import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireDbUser } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { BillingButtons } from "@/components/billing-buttons";

async function uniqueBusinessSlug(base: string) {
  let slug = base || "business";
  let suffix = 1;
  let exists = await prisma.business.findUnique({ where: { slug } });

  while (exists) {
    slug = `${base}-${suffix++}`;
    exists = await prisma.business.findUnique({ where: { slug } });
  }

  return slug;
}

async function uniqueLocationSlug(base: string) {
  let slug = base || "location";
  let suffix = 1;
  let exists = await prisma.location.findUnique({ where: { slug } });

  while (exists) {
    slug = `${base}-${suffix++}`;
    exists = await prisma.location.findUnique({ where: { slug } });
  }

  return slug;
}

async function createBusiness(formData: FormData) {
  "use server";
  const name = formData.get("name")?.toString().trim();
  if (!name) return;

  const { dbUser } = await requireDbUser();
  const slug = await uniqueBusinessSlug(slugify(name));

  const business = await prisma.business.create({
    data: {
      name,
      slug,
      ownerId: dbUser.id,
      plan: "STARTER",
    },
  });

  const locationSlug = await uniqueLocationSlug(`${slug}-main`);
  await prisma.location.create({
    data: {
      name: "Main location",
      slug: locationSlug,
      businessId: business.id,
    },
  });

  revalidatePath("/dashboard");
}

async function createLocation(formData: FormData) {
  "use server";
  const businessId = formData.get("businessId")?.toString();
  const name = formData.get("locationName")?.toString().trim();
  if (!businessId || !name) return;

  const slugBase = slugify(name);
  const slug = await uniqueLocationSlug(slugBase);

  await prisma.location.create({
    data: {
      name,
      slug,
      businessId,
    },
  });

  revalidatePath("/dashboard");
}

export default async function DashboardPage() {
  const { dbUser } = await requireDbUser();

  const business = await prisma.business.findFirst({
    where: { ownerId: dbUser.id },
    include: {
      locations: true,
    },
  });

  if (!business) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold text-foreground">Create your business</h1>
        <p className="mt-2 text-sm text-muted">
          We&apos;ll create your workspace and a default location so you can start
          collecting feedback right away.
        </p>
        <form action={createBusiness} className="mt-6 flex flex-col gap-3">
          <label className="text-sm text-muted">Business name</label>
          <input
            name="name"
            placeholder="e.g., Northside Coffee"
            className="rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
            required
          />
          <button
            type="submit"
            className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-white transition hover:brightness-110"
          >
            Continue
          </button>
        </form>
      </div>
    );
  }

  const sessions = await prisma.feedbackSession.findMany({
    where: { location: { businessId: business.id } },
    include: { location: true, summary: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const totalSessions = sessions.length;
  const summarized = sessions.filter((s) => s.summary).length;
  const positive =
    sessions.filter((s) => s.summary?.sentiment === "POSITIVE").length || 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted">Welcome back</p>
          <h1 className="text-3xl font-semibold text-foreground">
            {business.name}
          </h1>
          <p className="text-sm text-muted">Plan: {business.plan}</p>
        </div>
        <BillingButtons plan={business.plan} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted">Sessions</p>
          <p className="text-2xl font-semibold text-foreground">{totalSessions}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted">Summarized</p>
          <p className="text-2xl font-semibold text-foreground">{summarized}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted">Positive</p>
          <p className="text-2xl font-semibold text-foreground">
            {positive}/{summarized || 1}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Locations</h2>
            <p className="text-sm text-muted">
              Share the QR link with customers to start capturing feedback.
            </p>
          </div>
          <form action={createLocation} className="flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="businessId" value={business.id} />
            <input
              name="locationName"
              placeholder="Add a new location"
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
            />
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
            >
              Add
            </button>
          </form>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {business.locations.map((loc) => (
            <div
              key={loc.id}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-surface/60 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground">{loc.name}</p>
                  <p className="text-xs text-muted">Slug: {loc.slug}</p>
                </div>
                <Link
                  className="text-sm font-medium text-primary underline"
                  href={`/feedback/${loc.slug}`}
                  target="_blank"
                >
                  Open link
                </Link>
              </div>
              <div className="text-xs text-muted">
                QR link: /feedback/{loc.slug}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Recent sessions</h2>
          <p className="text-xs text-muted">Last 20 conversations</p>
        </div>
        <div className="grid gap-3">
          {sessions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
              No sessions yet. Share your location link to start capturing feedback.
            </div>
          )}
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/dashboard/sessions/${session.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-surface/60 p-4 transition hover:border-primary"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-foreground">
                  {session.customerName || "Guest"} • {session.location.name}
                </div>
                <div className="text-xs uppercase tracking-wide text-muted">
                  {session.summary?.sentiment || "PENDING"}
                </div>
              </div>
              <div className="text-xs text-muted">
                {session.summary?.summary?.slice(0, 120) ||
                  "Awaiting summary. Click to view transcript."}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

