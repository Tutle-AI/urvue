import Link from "next/link";
import { requireOnboardedSpace } from "@/lib/business";
import { prisma } from "@/lib/db";
import { pointLimit } from "@/lib/feedback-point";
import { PointEditor } from "../point-editor";
import { saveFeedbackPoint } from "../actions";

export default async function NewFeedbackPointPage() {
  const { account, membership } = await requireOnboardedSpace();
  const count = await prisma.feedbackPoint.count({ where: { space: { accountId: account.id } } });
  if (count >= pointLimit(account.plan) || membership.role === "MEMBER") return (
    <section className="rounded-3xl border border-border bg-card p-8">
      <h1 className="font-serif text-3xl">{membership.role === "MEMBER" ? "Your team manages these points" : "Your points, working for you"}</h1>
      <p className="mt-3 text-muted">{membership.role === "MEMBER" ? "Ask an account owner or admin to create a feedback point." : "You’ve used your plan’s feedback point allowance. You can edit any existing point at any time."}</p>
      <Link href="/dashboard/feedback-points" className="mt-5 inline-block text-primary">Back to Feedback Points →</Link>
    </section>
  );
  return <PointEditor action={saveFeedbackPoint.bind(null, null)} remaining={pointLimit(account.plan) - count} />;
}
