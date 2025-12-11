import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireDbUser } from "@/lib/auth";
import { slugify } from "@/lib/slug";

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

async function addLocation(formData: FormData) {
  "use server";
  const businessId = formData.get("businessId")?.toString();
  const name = formData.get("name")?.toString().trim();
  if (!businessId || !name) return;

  const slug = await uniqueLocationSlug(slugify(name));
  await prisma.location.create({
    data: { businessId, name, slug },
  });

  revalidatePath("/dashboard/locations");
  revalidatePath("/dashboard");
}

export default async function LocationsPage() {
  const { dbUser } = await requireDbUser();
  const business = await prisma.business.findFirst({
    where: { ownerId: dbUser.id },
    include: { locations: true },
  });

  if (!business) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted">
        Create a business first to add locations.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Locations</h1>
          <p className="text-sm text-muted">
            Manage QR destinations for {business.name}.
          </p>
        </div>
        <form action={addLocation} className="flex gap-2">
          <input type="hidden" name="businessId" value={business.id} />
          <input
            name="name"
            placeholder="Add location"
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

      <div className="grid gap-3 md:grid-cols-2">
        {business.locations.map((loc) => (
          <div
            key={loc.id}
            className="rounded-2xl border border-border bg-surface/60 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground">{loc.name}</p>
                <p className="text-xs text-muted">Slug: {loc.slug}</p>
              </div>
              <Link
                href={`/feedback/${loc.slug}`}
                target="_blank"
                className="text-sm font-medium text-primary underline"
              >
                Open
              </Link>
            </div>
            <div className="mt-2 text-xs text-muted">
              Share: {process.env.NEXT_PUBLIC_APP_URL || "your-domain"}/feedback/
              {loc.slug}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

