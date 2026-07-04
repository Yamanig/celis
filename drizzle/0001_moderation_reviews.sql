-- Add moderation statuses to listings
ALTER TYPE "public"."listing_status" ADD VALUE 'pending_review' AFTER 'draft';
ALTER TYPE "public"."listing_status" ADD VALUE 'rejected' AFTER 'expired';

-- Moderation metadata on listings
ALTER TABLE "public"."listings"
  ADD COLUMN "reviewed_at" timestamp with time zone;
ALTER TABLE "public"."listings"
  ADD COLUMN "reviewed_by" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL;
ALTER TABLE "public"."listings"
  ADD COLUMN "rejection_reason" text;

-- Reviews/ratings table
CREATE TABLE IF NOT EXISTS "public"."listing_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "listing_id" uuid NOT NULL REFERENCES "public"."listings"("id") ON DELETE CASCADE,
  "reviewer_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "rating" integer NOT NULL,
  "comment" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_listing_reviews_unique"
  ON "public"."listing_reviews" ("listing_id", "reviewer_id");
CREATE INDEX IF NOT EXISTS "idx_listing_reviews_listing_id"
  ON "public"."listing_reviews" ("listing_id");
