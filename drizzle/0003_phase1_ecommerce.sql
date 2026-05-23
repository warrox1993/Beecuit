CREATE TABLE "categories" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "category_translations" (
	"category_id" text NOT NULL,
	"locale" "locale" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "category_translations_category_id_locale_pk" PRIMARY KEY("category_id","locale")
);
--> statement-breakpoint
CREATE TABLE "product_translations" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" text NOT NULL,
	"locale" "locale" NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"short_description" text NOT NULL,
	"long_description" text NOT NULL,
	"ingredients" text NOT NULL,
	"allergens" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"nutritional_facts_per_100g" jsonb NOT NULL,
	"seo_title" text NOT NULL,
	"seo_description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" text NOT NULL,
	"url" text NOT NULL,
	"alt_text" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"label" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"postal_code" text NOT NULL,
	"city" text NOT NULL,
	"country" text DEFAULT 'BE' NOT NULL,
	"phone" text,
	"is_default_shipping" boolean DEFAULT false NOT NULL,
	"is_default_billing" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"session_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" text NOT NULL,
	"product_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text,
	"product_name_snapshot" text NOT NULL,
	"product_sku_snapshot" text NOT NULL,
	"unit_price_cents_snapshot" integer NOT NULL,
	"quantity" integer NOT NULL,
	"line_total_cents" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_rates" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"method" text NOT NULL,
	"country" text DEFAULT 'BE' NOT NULL,
	"weight_grams_max" integer NOT NULL,
	"price_cents" integer NOT NULL,
	"free_shipping_threshold_cents" integer,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	"order_id" text
);
--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "thumbnail_url";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category_id" text;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "stock_quantity" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "stock_quantity" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_address_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "billing_address_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_method" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_tracking_number" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "stripe_session_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "stripe_payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_stripe_session_id_unique" UNIQUE("stripe_session_id");--> statement-breakpoint
ALTER TABLE "category_translations" ADD CONSTRAINT "category_translations_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_translations" ADD CONSTRAINT "product_translations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_webhook_events" ADD CONSTRAINT "stripe_webhook_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_product_locale" ON "product_translations" USING btree ("product_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_locale_slug" ON "product_translations" USING btree ("locale","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_cart_product" ON "cart_items" USING btree ("cart_id","product_id");
