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
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <FeedbackChat
        slug={slug}
        businessName={location.business.name}
        locationName={location.name}
      />
    </div>
  );
}

