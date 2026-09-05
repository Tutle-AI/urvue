import { NextResponse } from "next/server";
import { requireAccountContext } from "@/lib/business";
import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const { account } = await requireAccountContext();
    if (!account.stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer for this business" },
        { status: 400 },
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: account.stripeCustomerId,
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

