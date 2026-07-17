ALTER TYPE "listing_status" ADD VALUE 'inactive';--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "deactivated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "deactivation_reason" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "sold_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "sold_to_order_id" uuid;