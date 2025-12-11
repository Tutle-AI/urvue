import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { proPriceId, starterPriceId, stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = Buffer.from(await request.arrayBuffer());

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const priceId = subscription.items?.data?.[0]?.price?.id as string;
      const plan =
        priceId === proPriceId
          ? "PRO"
          : priceId === starterPriceId
            ? "STARTER"
            : "STARTER";

      await prisma.business.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          stripeSubscriptionId: subscription.id as string,
          plan,
          trialEndsAt: subscription.trial_end
            ? new Date((subscription.trial_end as number) * 1000)
            : null,
        },
      });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      await prisma.business.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          plan: "STARTER",
          stripeSubscriptionId: null,
        },
      });
    }
  } catch (error) {
    console.error("Webhook handling failed", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

