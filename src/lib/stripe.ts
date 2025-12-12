import Stripe from "stripe";
import { env } from "./env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
});

export const starterPriceId = env.STRIPE_PRICE_STARTER;
export const proPriceId = env.STRIPE_PRICE_PRO;

