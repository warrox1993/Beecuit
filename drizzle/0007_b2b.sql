CREATE TYPE "public"."b2b_quote_status" AS ENUM('pending', 'quoted', 'paid', 'rejected', 'expired');

CREATE TABLE IF NOT EXISTS "b2b_quote_requests" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_name" text NOT NULL,
  "contact_name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "vat_number" text,
  "requested_products" text NOT NULL,
  "target_quantity" integer,
  "target_delivery_date" date,
  "budget_range" text,
  "message" text,
  "locale" text NOT NULL DEFAULT 'fr',
  "status" "b2b_quote_status" NOT NULL DEFAULT 'pending',
  "quoted_amount_cents" integer,
  "quote_description" text,
  "shipping_address" jsonb,
  "admin_notes" text,
  "stripe_product_id" text,
  "stripe_price_id" text,
  "stripe_payment_link_id" text,
  "stripe_payment_link_url" text,
  "rejected_reason" text,
  "source_ip" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "quoted_at" timestamp,
  "quoted_by" text,
  "quote_expires_at" timestamp,
  "paid_at" timestamp,
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "b2b_quote_requests_quoted_by_user_fk" FOREIGN KEY ("quoted_by") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "b2b_quote_requests_status_idx" ON "b2b_quote_requests" ("status");
CREATE INDEX IF NOT EXISTS "b2b_quote_requests_email_idx" ON "b2b_quote_requests" ("email");
CREATE INDEX IF NOT EXISTS "b2b_quote_requests_created_at_idx" ON "b2b_quote_requests" ("created_at" DESC);

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "b2b_quote_id" text;
CREATE INDEX IF NOT EXISTS "orders_b2b_quote_id_idx" ON "orders" ("b2b_quote_id");
