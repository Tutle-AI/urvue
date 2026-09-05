import { prisma } from "@/lib/db";

export async function uniqueBusinessSlug(base: string) {
  let slug = base || "space";
  let suffix = 1;
  let exists = await prisma.space.findUnique({ where: { slug } });

  while (exists) {
    slug = `${base}-${suffix++}`;
    exists = await prisma.space.findUnique({ where: { slug } });
  }

  return slug;
}

export async function uniqueLocationSlug(base: string) {
  let slug = base || "feedback";
  let suffix = 1;
  let exists = await prisma.feedbackPoint.findUnique({ where: { slug } });

  while (exists) {
    slug = `${base}-${suffix++}`;
    exists = await prisma.feedbackPoint.findUnique({ where: { slug } });
  }

  return slug;
}
