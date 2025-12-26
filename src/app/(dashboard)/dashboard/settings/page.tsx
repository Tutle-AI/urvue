import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOnboardedBusiness } from "@/lib/business";
import { BillingButtons } from "@/components/billing-buttons";
import { maxLocationsForPlan } from "@/lib/plan";

const BUSINESS_TYPES = [
  "Website",
  "Restaurant",
  "Retail",
  "Barbershop",
  "Salon/Spa",
  "Event",
  "Other",
] as const;

export default async function SettingsPage() {
  const { business } = await requireOnboardedBusiness();

  const locations = await prisma.location.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
  });

  async function save(formData: FormData) {
    "use server";
    const { business } = await requireOnboardedBusiness();

    const businessType = formData.get("businessType")?.toString().trim() || "";
    const descriptionRaw = formData.get("description")?.toString() || "";
    const description = descriptionRaw.trim().slice(0, 500);
    const focusTopic1 = formData.get("focusTopic1")?.toString().trim() || "";
    const focusTopic2 = formData.get("focusTopic2")?.toString().trim() || "";
    const focusTopic3 = formData.get("focusTopic3")?.toString().trim() || "";

    await prisma.business.update({
      where: { id: business.id },
      data: {
        businessType: businessType || null,
        description: description || null,
        focusTopic1: focusTopic1 || null,
        focusTopic2: focusTopic2 || null,
        focusTopic3: focusTopic3 || null,
      },
    });

    revalidatePath("/dashboard/settings");
  }

  const limit = maxLocationsForPlan(business.plan);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted">Settings</p>
          <h1 className="text-3xl font-semibold text-foreground">
            {business.name}
          </h1>
          <p className="text-sm text-muted">
            Plan: {business.plan} • Locations: {locations.length}/{limit}
          </p>
        </div>
        <BillingButtons plan={business.plan} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">
            AI instructions
          </h2>
          <p className="mt-2 text-sm text-muted">
            These settings shape every customer conversation. Customers never see
            this.
          </p>

          <form action={save} className="mt-6 space-y-5">
            <div>
              <label className="text-sm text-muted">Business type</label>
              <select
                name="businessType"
                defaultValue={business.businessType || "Website"}
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-end justify-between gap-4">
                <label className="text-sm text-muted">
                  Short description (max 500 chars)
                </label>
                <div className="text-xs text-muted">
                  {(business.description || "").length}/500
                </div>
              </div>
              <textarea
                name="description"
                defaultValue={business.description || ""}
                className="mt-2 min-h-[140px] w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="text-sm text-muted">Focus topics</label>
              <div className="mt-2 grid gap-3">
                <input
                  name="focusTopic1"
                  defaultValue={business.focusTopic1 || ""}
                  placeholder="1) e.g., Speed of service"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
                />
                <input
                  name="focusTopic2"
                  defaultValue={business.focusTopic2 || ""}
                  placeholder="2) e.g., Product quality"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
                />
                <input
                  name="focusTopic3"
                  defaultValue={business.focusTopic3 || ""}
                  placeholder="3) e.g., Cleanliness"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
                />
              </div>
            </div>

            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-white transition hover:brightness-110"
            >
              Save changes
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground">Share</h2>
            <p className="mt-2 text-sm text-muted">
              Your customers use these links to start a conversation.
            </p>
            <div className="mt-4 space-y-3">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="rounded-2xl border border-border bg-surface/60 p-4"
                >
                  <div className="text-sm text-foreground">{loc.name}</div>
                  <div className="mt-1 text-xs text-muted">
                    /feedback/{loc.slug}
                  </div>
                </div>
              ))}
              {locations.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
                  No locations yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground">
              Location limit
            </h2>
            <p className="mt-2 text-sm text-muted">
              Starter includes 1 location. Pro includes 5. Need more? Contact us
              for Enterprise.
            </p>
            <div className="mt-4 rounded-2xl border border-border bg-surface/60 p-4 text-sm text-foreground">
              {locations.length}/{limit} locations used
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

