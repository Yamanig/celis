ALTER TABLE "profiles" ADD COLUMN "seller_number" varchar(20);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_profiles_seller_number" ON "profiles" USING btree ("seller_number");