import { notFound } from "next/navigation";
import { FeedbackChat } from "@/components/feedback-chat";
import { prisma } from "@/lib/db";

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const location = await prisma.location.findUnique({
    where: { slug },
    include: { business: true },
  });

  if (!location) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto flex max-w-5xl items-center justify-center">
      <FeedbackChat
        slug={slug}
        businessName={location.business.name}
        locationName={location.name}
      />
      </div>
    </div>
  );
}

