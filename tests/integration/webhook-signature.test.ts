import { describe, it, expect } from "vitest";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";

describe("webhook signature", () => {
  it("constructs event with valid signature", () => {
    const payload = JSON.stringify({
      id: "evt_test",
      type: "checkout.session.completed",
      data: { object: {} },
    });
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: env.STRIPE_WEBHOOK_SECRET,
    });
    const ev = stripe.webhooks.constructEvent(payload, header, env.STRIPE_WEBHOOK_SECRET);
    expect(ev.id).toBe("evt_test");
  });

  it("rejects invalid signature", () => {
    const payload = JSON.stringify({
      id: "evt_test",
      type: "checkout.session.completed",
      data: { object: {} },
    });
    expect(() =>
      stripe.webhooks.constructEvent(payload, "bogus", env.STRIPE_WEBHOOK_SECRET),
    ).toThrow();
  });
});
