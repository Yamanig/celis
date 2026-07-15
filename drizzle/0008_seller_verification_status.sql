-- Phase 3 addendum: explicit seller verification status and rejection reason.
-- Run this after 0007_change_request_foundation.sql has been applied.

DO $$ BEGIN
 CREATE TYPE "public"."verification_status" AS ENUM('pending', 'approved', 'rejected', 'suspended');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_status" "verification_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_rejection_reason" text;

-- Backfill: any user with a non-null verified_at is approved; everyone else starts as pending.
UPDATE "users"
SET "verification_status" = 'approved'
WHERE "verified_at" IS NOT NULL AND "verification_status" = 'pending';
