import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  appInfo: { name: "BeeCuit", version: "0.1.0" },
});
