CREATE TABLE "auth_rate_limit_hits" (
	"identifier" text,
	"ip" text,
	"hit_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "auth_rate_limit_hits_identifier_hit_at_idx" ON "auth_rate_limit_hits" USING btree ("identifier","hit_at");--> statement-breakpoint
CREATE INDEX "auth_rate_limit_hits_ip_hit_at_idx" ON "auth_rate_limit_hits" USING btree ("ip","hit_at");