-- Add UNIQUE + FK constraints on orders.b2b_quote_id and orders.subscription_box_id
-- Goal: prevent duplicate shadow orders when Stripe re-delivers the same checkout.session.completed
-- or invoice.paid event, and enforce referential integrity.

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_b2b_quote_id_fk"
  FOREIGN KEY ("b2b_quote_id")
  REFERENCES "b2b_quote_requests"("id")
  ON DELETE SET NULL;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_b2b_quote_id_unique"
  UNIQUE ("b2b_quote_id");

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_subscription_box_id_unique"
  UNIQUE ("subscription_box_id");

ALTER TABLE "gift_card_redemptions"
  ADD CONSTRAINT "gift_card_redemptions_order_id_unique"
  UNIQUE ("order_id");
