"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOnboardedSpace } from "@/lib/business";
import { feedbackPointSchema, pointLimit, type PointActionState } from "@/lib/feedback-point";
import { slugify } from "@/lib/slug";

export async function saveFeedbackPoint(id: string | null, _previous: PointActionState, formData: FormData): Promise<PointActionState> {
  const { account, space, membership } = await requireOnboardedSpace();
  if (membership.role === "MEMBER") return { error: "Only account owners and admins can manage feedback points." };
  const parsed = feedbackPointSchema.safeParse({
    name: formData.get("name"), businessType: formData.get("businessType"),
    description: formData.get("description"), goals: formData.getAll("goal"),
    agentPersona: formData.get("agentPersona"),
  });
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ||= issue.message;
    return { error: "Check the highlighted fields, then try again.", fields };
  }
  let savedId: string;
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Serialize creation requests so concurrent submits cannot exceed the allowance.
      await tx.$queryRaw`SELECT "id" FROM "Account" WHERE "id" = ${account.id} FOR UPDATE`;
      if (id) {
        const updated = await tx.feedbackPoint.updateMany({ where: { id, spaceId: space.id, space: { accountId: account.id } }, data: parsed.data });
        return updated.count ? { id } : { error: "This feedback point is no longer available in your account." };
      }
      const count = await tx.feedbackPoint.count({ where: { space: { accountId: account.id } } });
      if (count >= pointLimit(account.plan)) return { error: `Your plan includes ${pointLimit(account.plan)} feedback points. You can still edit your existing points.` };
      const point = await tx.feedbackPoint.create({ data: {
        ...parsed.data, spaceId: space.id,
        slug: `${slugify(parsed.data.name) || "feedback"}-${randomUUID().slice(0, 8)}`,
      } });
      return { id: point.id };
    });
    if ("error" in result) return { error: result.error };
    savedId = result.id;
  } catch (error) {
    console.error("Could not save feedback point", error);
    return { error: "We couldn’t save your point. Your edits are still here—please try again." };
  }
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/feedback-points?saved=${encodeURIComponent(savedId)}`);
}
