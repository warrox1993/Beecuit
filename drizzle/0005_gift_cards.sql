-- Add gift_card to the product_type enum
ALTER TYPE "product_type" ADD VALUE IF NOT EXISTS 'gift_card';
--> statement-breakpoint

-- gift_cards table
CREATE TABLE "gift_cards" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL UNIQUE,
  "initial_amount_cents" integer NOT NULL,
  "remaining_amount_cents" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'EUR',
  "purchaser_user_id" text,
  "purchaser_email" text NOT NULL,
  "recipient_email" text NOT NULL,
  "recipient_name" text,
  "message" text,
  "delivery_at" timestamp NOT NULL,
  "delivered_at" timestamp,
  "expires_at" timestamp NOT NULL,
  "purchase_order_id" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "gift_card_amount_positive" CHECK ("initial_amount_cents" > 0 AND "remaining_amount_cents" >= 0),
  CONSTRAINT "gift_card_remaining_not_exceeds_initial" CHECK ("remaining_amount_cents" <= "initial_amount_cents")
);
--> statement-breakpoint

ALTER TABLE "gift_cards"
  ADD CONSTRAINT "gift_cards_purchaser_user_id_users_id_fk"
  FOREIGN KEY ("purchaser_user_id") REFERENCES "public"."users"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "gift_cards"
  ADD CONSTRAINT "gift_cards_purchase_order_id_orders_id_fk"
  FOREIGN KEY ("purchase_order_id") REFERENCES "public"."orders"("id") ON DELETE set null;
--> statement-breakpoint

-- gift_card_redemptions table
CREATE TABLE "gift_card_redemptions" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "gift_card_id" text NOT NULL,
  "order_id" text NOT NULL,
  "amount_cents" integer NOT NULL,
  "stripe_coupon_id" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "redemption_amount_positive" CHECK ("amount_cents" > 0)
);
--> statement-breakpoint

ALTER TABLE "gift_card_redemptions"
  ADD CONSTRAINT "gcr_gift_card_id_fk"
  FOREIGN KEY ("gift_card_id") REFERENCES "public"."gift_cards"("id") ON DELETE restrict;
--> statement-breakpoint
ALTER TABLE "gift_card_redemptions"
  ADD CONSTRAINT "gcr_order_id_fk"
  FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict;
--> statement-breakpoint

ALTER TABLE "orders" ADD COLUMN "gift_card_redemption_id" text;
--> statement-breakpoint
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_gift_card_redemption_id_fk"
  FOREIGN KEY ("gift_card_redemption_id") REFERENCES "public"."gift_card_redemptions"("id") ON DELETE set null;
