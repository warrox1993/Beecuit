ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cancel_deletion_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cancel_deletion_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pending_email" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pending_email_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pending_email_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_change_undo_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_change_undo_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_change_undo_to" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "purged_at" timestamp;--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" USING btree ("deleted_at") WHERE "users"."deleted_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "users_pending_email_token_idx" ON "users" USING btree ("pending_email_token") WHERE "users"."pending_email_token" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "users_cancel_deletion_token_idx" ON "users" USING btree ("cancel_deletion_token") WHERE "users"."cancel_deletion_token" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "users_email_change_undo_token_idx" ON "users" USING btree ("email_change_undo_token") WHERE "users"."email_change_undo_token" IS NOT NULL;