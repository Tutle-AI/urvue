import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const { dbUser } = await requireDbUser();

    const business = await prisma.business.findFirst({
      where: { ownerId: dbUser.id },
    });

    if (!business?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer for this business" },
        { status: 400 },
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: business.stripeCustomerId,
      return_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to create billing portal" },
      { status: 500 },
    );
  }
}

