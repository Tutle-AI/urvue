import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireDbUser } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { uniqueBusinessSlug, uniqueLocationSlug } from "@/lib/unique-slug";
import { OnboardingWizard } from "@/components/onboarding-wizard";

async function getInitialValues(ownerId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId },
    include: { locations: { orderBy: { createdAt: "asc" }, take: 1 } },
  });

  return {
    businessName: business?.name ?? "",
    businessType: business?.businessType ?? "Website",
    description: business?.description ?? "",
    focusTopic1: business?.focusTopic1 ?? "",
    focusTopic2: business?.focusTopic2 ?? "",
    focusTopic3: business?.focusTopic3 ?? "",
    locationName: business?.locations?.[0]?.name ?? "Main location",
    onboardingCompletedAt: business?.onboardingCompletedAt ?? null,
  };
}

export default async function OnboardingPage() {
  const { dbUser } = await requireDbUser();
  const initial = await getInitialValues(dbUser.id);

  if (initial.onboardingCompletedAt) {
    redirect("/dashboard");
  }

  async function completeOnboarding(formData: FormData) {
    "use server";

    const businessName = formData.get("businessName")?.toString().trim() || "";
    const businessType = formData.get("businessType")?.toString().trim() || "";
    const descriptionRaw = formData.get("description")?.toString() || "";
    const description = descriptionRaw.trim().slice(0, 500);
    const focusTopic1 = formData.get("focusTopic1")?.toString().trim() || "";
    const focusTopic2 = formData.get("focusTopic2")?.toString().trim() || "";
    const focusTopic3 = formData.get("focusTopic3")?.toString().trim() || "";
    const locationName = formData.get("locationName")?.toString().trim() || "";

    if (!businessName || !locationName || !description) {
      return;
    }

    const { dbUser } = await requireDbUser();

    const existing = await prisma.business.findFirst({
      where: { ownerId: dbUser.id },
      include: { locations: { orderBy: { createdAt: "asc" } } },
    });

    let businessId = existing?.id ?? null;
    let businessSlug = existing?.slug ?? null;

    if (!existing) {
      const base = slugify(businessName);
      const slug = await uniqueBusinessSlug(base);
      const created = await prisma.business.create({
        data: {
          name: businessName,
          slug,
          ownerId: dbUser.id,
          plan: "STARTER",
          businessType: businessType || null,
          description: description || null,
          focusTopic1: focusTopic1 || null,
          focusTopic2: focusTopic2 || null,
          focusTopic3: focusTopic3 || null,
          onboardingCompletedAt: new Date(),
        },
      });
      businessId = created.id;
      businessSlug = created.slug;
    } else {
      await prisma.business.update({
        where: { id: existing.id },
        data: {
          name: businessName,
          businessType: businessType || null,
          description: description || null,
          focusTopic1: focusTopic1 || null,
          focusTopic2: focusTopic2 || null,
          focusTopic3: focusTopic3 || null,
          onboardingCompletedAt: new Date(),
        },
      });
    }

    if (!businessId || !businessSlug) {
      return;
    }

    const firstLocation = existing?.locations?.[0] ?? null;
    if (!firstLocation) {
      const locationSlug = await uniqueLocationSlug(`${businessSlug}-main`);
      await prisma.location.create({
        data: {
          name: locationName,
          slug: locationSlug,
          businessId,
        },
      });
    } else if (firstLocation.name !== locationName) {
      await prisma.location.update({
        where: { id: firstLocation.id },
        data: { name: locationName },
      });
    }

    redirect("/dashboard");
  }

  return (
    <div className="py-6">
      <OnboardingWizard
        action={completeOnboarding}
        initialValues={{
          businessName: initial.businessName,
          businessType: initial.businessType,
          description: initial.description,
          focusTopic1: initial.focusTopic1,
          focusTopic2: initial.focusTopic2,
          focusTopic3: initial.focusTopic3,
          locationName: initial.locationName,
        }}
      />
    </div>
  );
}

