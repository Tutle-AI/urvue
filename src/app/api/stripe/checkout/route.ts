import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { proPriceId, starterPriceId, stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const plan = body.plan === "pro" ? "PRO" : "STARTER";

    const { dbUser } = await requireDbUser();

    const business = await prisma.business.findFirst({
      where: { ownerId: dbUser.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Create a business before checking out" },
        { status: 400 },
      );
    }

    const customerId =
      business.stripeCustomerId ||
      (
        await stripe.customers.create({
          email: dbUser.email,
          metadata: { businessId: business.id },
        })
      ).id;

    if (!business.stripeCustomerId) {
      await prisma.business.update({
        where: { id: business.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: plan === "PRO" ? proPriceId : starterPriceId,
          quantity: 1,
        },
      ],
      success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=cancelled`,
      subscription_data: {
        metadata: { businessId: business.id },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to start checkout" },
      { status: 500 },
    );
  }
}

