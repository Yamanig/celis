CREATE TABLE IF NOT EXISTS "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"domain" text DEFAULT 'internal' NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_roles_key" ON "roles" USING btree ("key");
--> statement-breakpoint
INSERT INTO "roles" ("key", "label", "domain", "is_system") VALUES
	('buyer', 'Buyer', 'customer', true),
	('seller', 'Seller', 'customer', true),
	('admin', 'Admin', 'internal', true),
	('listing_review_officer', 'Listing Review Officer', 'internal', true),
	('seller_verification_officer', 'Seller Verification Officer', 'internal', true),
	('listing_review_and_verification_officer', 'Listing Review & Verification Officer', 'internal', true),
	('finance_officer', 'Finance Officer', 'internal', true),
	('support_officer', 'Support Officer', 'internal', true),
	('auditor', 'Auditor', 'internal', true)
ON CONFLICT ("key") DO NOTHING;