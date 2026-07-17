DO $$ BEGIN
 CREATE TYPE "public"."verification_status" AS ENUM('pending', 'approved', 'rejected', 'suspended');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_status" "verification_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_rejection_reason" text;