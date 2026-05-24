CREATE TYPE "subscription_format" AS ENUM ('mini', 'classique', 'famille');
--> statement-breakpoint
CREATE TYPE "subscription_status" AS ENUM ('trialing', 'active', 'paused', 'cancelled', 'expired', 'past_due');
--> statement-breakpoint
CREATE TYPE "subscription_box_status" AS ENUM ('composing', 'locked', 'shipped', 'skipped');
--> statement-breakpoint

CREATE TABLE "subscriptions" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "stripe_customer_id" text NOT NULL,
  "stripe_subscription_id" text NOT NULL UNIQUE,
  "format" "subscription_format" NOT NULL,
  "engagement_months" integer NOT NULL,
  "status" "subscription_status" NOT NULL DEFAULT 'trialing',
  "started_at" timestamp NOT NULL DEFAULT now(),
  "engagement_ends_at" timestamp,
  "paused_at" timestamp,
  "cancelled_at" timestamp,
  "shipping_address_snapshot" jsonb NOT NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "subscription_engagement_valid" CHECK ("engagement_months" IN (0, 6, 12))
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;
--> statement-breakpoint

CREATE TABLE "subscription_boxes" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "subscription_id" text NOT NULL,
  "cycle_year_month" text NOT NULL,
  "status" "subscription_box_status" NOT NULL DEFAULT 'composing',
  "composition_deadline" timestamp NOT NULL,
  "shipping_order_id" text,
  "composed_by" text,
  "composing_email_sent_at" timestamp,
  "reminder_email_sent_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "cycle_year_month_format" CHECK ("cycle_year_month" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);
--> statement-breakpoint
ALTER TABLE "subscription_boxes" ADD CONSTRAINT "sb_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "subscription_boxes" ADD CONSTRAINT "sb_shipping_order_id_fk" FOREIGN KEY ("shipping_order_id") REFERENCES "public"."orders"("id") ON DELETE set null;
--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_subscription_box_month" ON "subscription_boxes" ("subscription_id", "cycle_year_month");
--> statement-breakpoint

CREATE TABLE "subscription_box_items" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "box_id" text NOT NULL,
  "biscuit_id" text NOT NULL,
  "quantity" integer NOT NULL,
  CONSTRAINT "sbi_quantity_positive" CHECK ("quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "subscription_box_items" ADD CONSTRAINT "sbi_box_id_fk" FOREIGN KEY ("box_id") REFERENCES "public"."subscription_boxes"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "subscription_box_items" ADD CONSTRAINT "sbi_biscuit_id_fk" FOREIGN KEY ("biscuit_id") REFERENCES "public"."products"("id") ON DELETE restrict;
--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_box_biscuit" ON "subscription_box_items" ("box_id", "biscuit_id");
--> statement-breakpoint

ALTER TABLE "orders" ADD COLUMN "subscription_box_id" text;
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_subscription_box_id_fk" FOREIGN KEY ("subscription_box_id") REFERENCES "public"."subscription_boxes"("id") ON DELETE set null;
