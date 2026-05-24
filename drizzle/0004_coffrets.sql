-- Add discount_percent to products (NULL for biscuits, 0-99 for coffrets)
ALTER TABLE "products" ADD COLUMN "discount_percent" integer;
--> statement-breakpoint
ALTER TABLE "products"
  ADD CONSTRAINT "products_discount_percent_range"
  CHECK ("discount_percent" IS NULL OR ("discount_percent" >= 0 AND "discount_percent" <= 99));
--> statement-breakpoint

-- Add metadata jsonb to cart_items and order_items
ALTER TABLE "cart_items" ADD COLUMN "metadata" jsonb;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "metadata" jsonb;
--> statement-breakpoint

-- Drop the unique(cart_id, product_id) index so coffrets with different gift messages can coexist
DROP INDEX IF EXISTS "uniq_cart_product";
--> statement-breakpoint

-- Create coffret_contents table
CREATE TABLE "coffret_contents" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "coffret_id" text NOT NULL,
  "biscuit_id" text NOT NULL,
  "quantity" integer NOT NULL,
  CONSTRAINT "coffret_quantity_positive" CHECK ("quantity" > 0)
);
--> statement-breakpoint

ALTER TABLE "coffret_contents"
  ADD CONSTRAINT "coffret_contents_coffret_id_products_id_fk"
  FOREIGN KEY ("coffret_id") REFERENCES "public"."products"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "coffret_contents"
  ADD CONSTRAINT "coffret_contents_biscuit_id_products_id_fk"
  FOREIGN KEY ("biscuit_id") REFERENCES "public"."products"("id") ON DELETE restrict;
--> statement-breakpoint

CREATE UNIQUE INDEX "uniq_coffret_biscuit" ON "coffret_contents" ("coffret_id", "biscuit_id");
