import { notFound } from "next/navigation";
import { FeedbackChat } from "@/components/feedback-chat";
import { prisma } from "@/lib/db";
import { PERSONAS } from "@/lib/interview";
import { featureEnabled } from "@/lib/features";

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!featureEnabled("publicConversations")) notFound();
  const { slug } = await params;
  const feedbackPoint = await prisma.feedbackPoint.findUnique({
    where: { slug },
    include: { space: true },
  });

  if (!feedbackPoint || !feedbackPoint.active) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground md:py-12">
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] max-w-5xl items-center justify-center">
        <FeedbackChat
          slug={slug}
          spaceName={feedbackPoint.space.name}
          feedbackPointName={feedbackPoint.name}
          agentName={PERSONAS[feedbackPoint.space.agentPersona].name}
        />
      </div>
    </div>
  );
}

