ALTER TABLE "listing_packages" ADD COLUMN "code" varchar(60);--> statement-breakpoint
ALTER TABLE "listing_packages" ADD COLUMN "seller_type_eligibility" "seller_type";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_listing_packages_code" ON "listing_packages" USING btree ("code");--> statement-breakpoint
UPDATE "listing_packages" SET "is_unlimited" = true, "listing_allowance" = 0 WHERE "listing_allowance" = 999999;