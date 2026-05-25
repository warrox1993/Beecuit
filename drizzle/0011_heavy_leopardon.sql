CREATE TYPE "public"."newsletter_status" AS ENUM('pending', 'confirmed', 'unsubscribed');--> statement-breakpoint
CREATE TYPE "public"."journal_category" AS ENUM('recettes', 'savoir-faire', 'saisons', 'atelier');--> statement-breakpoint
CREATE TYPE "public"."journal_email_status" AS ENUM('sent', 'failed', 'bounced');--> statement-breakpoint
CREATE TYPE "public"."journal_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."recipe_difficulty" AS ENUM('facile', 'moyen', 'avance');--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"locale" "locale" NOT NULL,
	"status" "newsletter_status" DEFAULT 'pending' NOT NULL,
	"journal_opt_in" boolean DEFAULT false NOT NULL,
	"confirm_token" text NOT NULL,
	"unsubscribe_token" text NOT NULL,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email"),
	CONSTRAINT "newsletter_subscribers_confirm_token_unique" UNIQUE("confirm_token"),
	CONSTRAINT "newsletter_subscribers_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "journal_article_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"body_json" jsonb NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"recipe_yield_label" text,
	"recipe_ingredients" jsonb,
	"recipe_steps" jsonb
);
--> statement-breakpoint
CREATE TABLE "journal_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"status" "journal_status" DEFAULT 'draft' NOT NULL,
	"category" "journal_category" NOT NULL,
	"cover_image" text NOT NULL,
	"cover_alt_fr" text NOT NULL,
	"pinterest_image" text,
	"author" text DEFAULT 'Au Fil des Saveurs' NOT NULL,
	"reading_minutes" integer DEFAULT 1 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"recipe_prep_min" integer,
	"recipe_cook_min" integer,
	"recipe_difficulty" "recipe_difficulty",
	"journal_email_sent_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"featured_product_slugs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "journal_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "journal_email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"recipient_email" text NOT NULL,
	"status" "journal_email_status" NOT NULL,
	"resend_id" text,
	"error_message" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "journal_article_translations" ADD CONSTRAINT "journal_article_translations_article_id_journal_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."journal_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_email_log" ADD CONSTRAINT "journal_email_log_article_id_journal_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."journal_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "journal_translation_article_locale_unique" ON "journal_article_translations" USING btree ("article_id","locale");