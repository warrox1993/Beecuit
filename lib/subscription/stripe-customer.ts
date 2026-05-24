import "server-only";
import { stripe } from "@/lib/stripe/client";

// Get-or-create a Stripe Customer for a user. Uses Stripe Customer Search to find
// existing matches, otherwise creates a new one. Idempotent across calls.
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
): Promise<string> {
  const existing = await stripe.customers.search({
    query: `email:'${email}' AND metadata['userId']:'${userId}'`,
  });
  if (existing.data[0]) return existing.data[0].id;

  const created = await stripe.customers.create({
    email,
    metadata: { userId },
  });
  return created.id;
}
