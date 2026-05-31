CREATE TABLE "two_factor_recovery_codes" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"code_hash" text NOT NULL,
	"used_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "last_seen_at" timestamp;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "ip" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_enabled_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_disable_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_disable_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "two_factor_recovery_codes" ADD CONSTRAINT "two_factor_recovery_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recovery_codes_user_id_idx" ON "two_factor_recovery_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_2fa_disable_token_idx" ON "users" USING btree ("two_factor_disable_token") WHERE "users"."two_factor_disable_token" IS NOT NULL;