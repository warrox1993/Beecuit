import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { stripeWebhookEvents, orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { handleCheckoutCompleted } from "@/lib/stripe/webhook";

const FAKE_ORDER_ID = "fake-order-idem-test";
const FAKE_EVENT_ID = "evt_idem_test";

beforeAll(async () => {
  await db.delete(orders).where(eq(orders.id, FAKE_ORDER_ID));
  await db.delete(stripeWebhookEvents).where(eq(stripeWebhookEvents.id, FAKE_EVENT_ID));
  await db.insert(orders).values({
    id: FAKE_ORDER_ID,
    orderNumber: "BCT-TEST-000001",
    subtotalCents: 1000,
    totalCents: 1000,
    status: "pending",
  });
});

describe("webhook idempotency", () => {
  it("processes once, no-ops on second call", async () => {
    const ev = {
      id: FAKE_EVENT_ID,
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { order_id: FAKE_ORDER_ID },
          payment_intent: "pi_test",
        },
      },
    } as unknown as Parameters<typeof handleCheckoutCompleted>[0];

    await handleCheckoutCompleted(ev);
    await handleCheckoutCompleted(ev);

    const [o] = await db.select().from(orders).where(eq(orders.id, FAKE_ORDER_ID));
    expect(o?.status).toBe("paid");

    const events = await db
      .select()
      .from(stripeWebhookEvents)
      .where(eq(stripeWebhookEvents.id, FAKE_EVENT_ID));
    expect(events).toHaveLength(1);
  });
});
