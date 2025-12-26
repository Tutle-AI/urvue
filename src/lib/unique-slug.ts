import { prisma } from "@/lib/db";

export async function uniqueBusinessSlug(base: string) {
  let slug = base || "business";
  let suffix = 1;
  let exists = await prisma.business.findUnique({ where: { slug } });

  while (exists) {
    slug = `${base}-${suffix++}`;
    exists = await prisma.business.findUnique({ where: { slug } });
  }

  return slug;
}

export async function uniqueLocationSlug(base: string) {
  let slug = base || "location";
  let suffix = 1;
  let exists = await prisma.location.findUnique({ where: { slug } });

  while (exists) {
    slug = `${base}-${suffix++}`;
    exists = await prisma.location.findUnique({ where: { slug } });
  }

  return slug;
}

