CREATE TYPE "public"."product_type" AS ENUM('biscuit', 'coffret', 'subscription_plan');--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "product_type" NOT NULL,
	"slug" text NOT NULL,
	"sku" text NOT NULL,
	"base_price_cents" integer NOT NULL,
	"weight_grams" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"stock_quantity" integer,
	"thumbnail_url" text,
	"model_3d_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
