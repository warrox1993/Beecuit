CREATE TYPE "public"."contact_reason" AS ENUM('order', 'b2b', 'press', 'delivery', 'other');--> statement-breakpoint
CREATE TYPE "public"."contact_status" AS ENUM('new', 'read', 'archived');--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"reason" "contact_reason" NOT NULL,
	"message" text NOT NULL,
	"locale" text DEFAULT 'fr' NOT NULL,
	"status" "contact_status" DEFAULT 'new' NOT NULL,
	"source_ip" text,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "contact_messages_status_created_idx" ON "contact_messages" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "contact_messages_source_ip_idx" ON "contact_messages" USING btree ("source_ip");