ALTER TABLE "listings" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "featured_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "featured_fee_cents" integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_listings_featured" ON "listings" USING btree ("status","is_featured","featured_until");
--> statement-breakpoint
ALTER TABLE "wallet_payments" ADD COLUMN "purpose" varchar(40) DEFAULT 'listing_fee' NOT NULL;