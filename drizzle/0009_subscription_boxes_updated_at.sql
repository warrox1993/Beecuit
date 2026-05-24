ALTER TABLE "subscription_boxes" ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
