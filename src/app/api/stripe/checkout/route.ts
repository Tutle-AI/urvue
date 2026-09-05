import { NextResponse } from "next/server";
import { requireAccountContext } from "@/lib/business";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { proPriceId, starterPriceId, stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const plan = body.plan === "pro" ? "PRO" : "STARTER";

    const { dbUser, account } = await requireAccountContext();

    const customerId =
      account.stripeCustomerId ||
      (
        await stripe.customers.create({
          email: dbUser.email,
          metadata: { accountId: account.id },
        })
      ).id;

    if (!account.stripeCustomerId) {
      await prisma.account.update({
        where: { id: account.id },
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
        metadata: { accountId: account.id },
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

