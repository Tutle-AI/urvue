import { AgentPersona, EntityType } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireDbUser } from "@/lib/auth";
import { ensureAccountForUser } from "@/lib/business";
import { slugify } from "@/lib/slug";
import { uniqueBusinessSlug, uniqueLocationSlug } from "@/lib/unique-slug";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { featureEnabled } from "@/lib/features";

function splitList(value: FormDataEntryValue | null) {
  return (value?.toString() || "").split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean).slice(0, 12);
}

export default async function OnboardingPage() {
  if (!featureEnabled("newOnboarding")) notFound();
  const { dbUser } = await requireDbUser();
  const account = await ensureAccountForUser(dbUser);
  const existing = await prisma.space.findFirst({
    where: { accountId: account.id },
    include: {
      feedbackPoints: { orderBy: { createdAt: "asc" }, take: 1 },
      goals: { where: { active: true }, orderBy: { priority: "asc" } },
      trackedEntities: { where: { active: true } },
      businessChanges: { where: { status: { in: ["PLANNED", "ACTIVE"] } }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (existing?.onboardingCompletedAt) redirect("/dashboard");

  async function completeOnboarding(formData: FormData) {
    "use server";
    const { dbUser } = await requireDbUser();
    const account = await ensureAccountForUser(dbUser);
    const name = formData.get("businessName")?.toString().trim().slice(0, 120) || "";
    const businessType = formData.get("businessType")?.toString().trim().slice(0, 80) || "";
    const description = formData.get("description")?.toString().trim().slice(0, 1_000) || "";
    const feedbackPointName = formData.get("locationName")?.toString().trim().slice(0, 120) || "";
    const personaValue = formData.get("agentPersona")?.toString() || "AMANDA";
    const persona: AgentPersona = ["AMANDA", "DEREK", "PROFESSIONAL", "DIRECT"].includes(personaValue) ? personaValue as AgentPersona : "AMANDA";
    const goals = splitList(formData.get("goals"));
    const recentChanges = formData.get("recentChanges")?.toString().trim().slice(0, 500) || "";
    if (!name || description.length < 10 || !goals.length || !feedbackPointName) return;

    let space = await prisma.space.findFirst({ where: { accountId: account.id, onboardingCompletedAt: null } });
    const firstThree = [...goals, null, null, null];
    if (!space) {
      space = await prisma.space.create({
        data: {
          name,
          slug: await uniqueBusinessSlug(slugify(name)),
          businessType: businessType || null,
          description,
          agentPersona: persona,
          ownerId: dbUser.id,
          accountId: account.id,
          focusTopic1: firstThree[0],
          focusTopic2: firstThree[1],
          focusTopic3: firstThree[2],
        },
      });
    } else {
      space = await prisma.space.update({
        where: { id: space.id },
        data: { name, businessType: businessType || null, description, agentPersona: persona, accountId: account.id, focusTopic1: firstThree[0], focusTopic2: firstThree[1], focusTopic3: firstThree[2] },
      });
    }

    const entityInputs: Array<[EntityType, string[]]> = [
      ["PERSON", splitList(formData.get("people"))],
      ["PRODUCT", splitList(formData.get("products"))],
      ["SERVICE", splitList(formData.get("services"))],
    ];
    await prisma.$transaction(async (tx) => {
      await tx.spaceGoal.deleteMany({ where: { spaceId: space.id, source: "ONBOARDING" } });
      await tx.spaceGoal.createMany({ data: goals.map((label, priority) => ({ spaceId: space.id, label, priority })) });
      for (const [type, names] of entityInputs) {
        for (const entityName of names) {
          await tx.trackedEntity.upsert({
            where: { spaceId_type_name: { spaceId: space.id, type, name: entityName } },
            create: { spaceId: space.id, type, name: entityName },
            update: { active: true },
          });
        }
      }
      if (recentChanges && !/^nothing\b/i.test(recentChanges)) {
        await tx.businessChange.create({ data: { spaceId: space.id, title: recentChanges, description: recentChanges } });
      }
      const point = await tx.feedbackPoint.findFirst({ where: { spaceId: space.id }, orderBy: { createdAt: "asc" } });
      if (point) {
        await tx.feedbackPoint.update({ where: { id: point.id }, data: { name: feedbackPointName, active: true } });
      } else {
        await tx.feedbackPoint.create({ data: { spaceId: space.id, name: feedbackPointName, slug: await uniqueLocationSlug(`${space.slug}-main`) } });
      }
      await tx.space.update({ where: { id: space.id }, data: { onboardingCompletedAt: new Date() } });
      await tx.account.update({ where: { id: account.id }, data: { name } });
    });
    redirect("/dashboard");
  }

  const byType = (type: EntityType) => existing?.trackedEntities.filter((entity) => entity.type === type).map((entity) => entity.name).join(", ") || "";
  return (
    <div className="py-6">
      <OnboardingWizard action={completeOnboarding} initialValues={{
        businessName: existing?.name,
        businessType: existing?.businessType,
        description: existing?.description,
        goals: existing?.goals.map((goal) => goal.label).join(", "),
        recentChanges: existing?.businessChanges[0]?.description,
        people: byType("PERSON"),
        products: byType("PRODUCT"),
        services: byType("SERVICE"),
        locationName: existing?.feedbackPoints[0]?.name,
        agentPersona: existing?.agentPersona,
      }} />
    </div>
  );
}
