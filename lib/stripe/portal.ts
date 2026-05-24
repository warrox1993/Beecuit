import "server-only";
import { stripe } from "./client";
import { env } from "@/lib/env";

export async function createPortalSession(
  customerId: string,
  locale: string,
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/${locale}/compte/abonnement`,
  });
  return session.url;
}
