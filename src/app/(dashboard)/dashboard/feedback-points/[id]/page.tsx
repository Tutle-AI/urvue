import { notFound } from "next/navigation";
import { requireOnboardedSpace } from "@/lib/business";
import { prisma } from "@/lib/db";
import { pointBrief } from "@/lib/feedback-point";
import { PointEditor } from "../point-editor";
import { saveFeedbackPoint } from "../actions";

export default async function EditFeedbackPointPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { space, membership } = await requireOnboardedSpace();
  const point = await prisma.feedbackPoint.findFirst({ where: { id, spaceId: space.id } });
  if (!point) notFound();
  return <PointEditor action={saveFeedbackPoint.bind(null, id)} initial={pointBrief(point)} readOnly={membership.role === "MEMBER"} />;
}
