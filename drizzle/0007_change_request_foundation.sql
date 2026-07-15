-- Phase 1 foundation migration for CR-CELIS-001
-- Safe-guarded with IF NOT EXISTS / exception blocks because the target DB
-- already contains some objects from earlier migrations.

--> Enum additions
DO $$ BEGIN
 CREATE TYPE "public"."interaction_type" AS ENUM('show_contact', 'request_callback');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."seller_type" AS ENUM('individual', 'shop');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subscription_status" AS ENUM('active', 'cancelled', 'expired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "item_condition" ADD VALUE IF NOT EXISTS 'brand_new';--> statement-breakpoint
ALTER TYPE "item_condition" ADD VALUE IF NOT EXISTS 'used';--> statement-breakpoint
ALTER TYPE "item_condition" ADD VALUE IF NOT EXISTS 'refurbished';--> statement-breakpoint
ALTER TYPE "item_condition" ADD VALUE IF NOT EXISTS 'local_used';--> statement-breakpoint
ALTER TYPE "listing_status" ADD VALUE IF NOT EXISTS 'pending_review';--> statement-breakpoint
ALTER TYPE "listing_status" ADD VALUE IF NOT EXISTS 'rejected';--> statement-breakpoint
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'listing_review_officer';--> statement-breakpoint
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'seller_verification_officer';--> statement-breakpoint
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'finance_officer';--> statement-breakpoint
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'support_officer';--> statement-breakpoint
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'auditor';--> statement-breakpoint

--> New category-condition mapping table
CREATE TABLE IF NOT EXISTS "category_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"code" "item_condition" NOT NULL,
	"label" varchar(100) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "category_conditions" ADD CONSTRAINT "category_conditions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_category_conditions_unique" ON "category_conditions" USING btree ("category_id","code");

--> Ensure dependent tables exist (some were added in previous migrations)
CREATE TABLE IF NOT EXISTS "listing_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "listing_reviews" ADD CONSTRAINT "listing_reviews_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "listing_reviews" ADD CONSTRAINT "listing_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_listing_reviews_unique" ON "listing_reviews" USING btree ("listing_id","reviewer_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	CONSTRAINT "permissions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" text NOT NULL,
	"permission_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_role_permissions_unique" ON "role_permissions" USING btree ("role","permission_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"metadata" jsonb,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_actor" ON "audit_logs" USING btree ("actor_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_resource" ON "audit_logs" USING btree ("resource_type","resource_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs" USING btree ("created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "listing_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"listing_allowance" integer NOT NULL,
	"is_unlimited" boolean DEFAULT false NOT NULL,
	"featured_allowance" integer,
	"duration_days" integer NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"auto_renew" boolean DEFAULT false NOT NULL,
	"grace_period_days" integer,
	"effective_from" timestamp with time zone,
	"effective_until" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listing_packages" ADD COLUMN IF NOT EXISTS "is_unlimited" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listing_packages" ADD COLUMN IF NOT EXISTS "featured_allowance" integer;--> statement-breakpoint
ALTER TABLE "listing_packages" ADD COLUMN IF NOT EXISTS "auto_renew" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listing_packages" ADD COLUMN IF NOT EXISTS "grace_period_days" integer;--> statement-breakpoint
ALTER TABLE "listing_packages" ADD COLUMN IF NOT EXISTS "effective_from" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "listing_packages" ADD COLUMN IF NOT EXISTS "effective_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "listing_packages" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seller_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"package_id" uuid NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"assignment_source" varchar(50),
	"payment_reference" varchar(255),
	"price_paid_cents" integer,
	"assigned_by" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seller_subscriptions" ADD COLUMN IF NOT EXISTS "assignment_source" varchar(50);--> statement-breakpoint
ALTER TABLE "seller_subscriptions" ADD COLUMN IF NOT EXISTS "payment_reference" varchar(255);--> statement-breakpoint
ALTER TABLE "seller_subscriptions" ADD COLUMN IF NOT EXISTS "price_paid_cents" integer;--> statement-breakpoint
ALTER TABLE "seller_subscriptions" ADD COLUMN IF NOT EXISTS "assigned_by" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "seller_subscriptions" ADD CONSTRAINT "seller_subscriptions_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "seller_subscriptions" ADD CONSTRAINT "seller_subscriptions_package_id_listing_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."listing_packages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "seller_subscriptions" ADD CONSTRAINT "seller_subscriptions_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "listing_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "interaction_type" NOT NULL,
	"phone" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "listing_interactions" ADD CONSTRAINT "listing_interactions_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "listing_interactions" ADD CONSTRAINT "listing_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_listing_interactions_listing_id" ON "listing_interactions" USING btree ("listing_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_listing_interactions_user_id" ON "listing_interactions" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_listing_interactions_type" ON "listing_interactions" USING btree ("type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_listing_interactions_created_at" ON "listing_interactions" USING btree ("created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "password_resets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_resets_token_unique" UNIQUE("token")
);

--> User-domain separation columns
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_internal" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_by" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "department" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfa_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> Listing fee/commission audit columns and expiry management
ALTER TABLE "listings" ALTER COLUMN "condition" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "monetization_type" SET DEFAULT 'fixed_rate';--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "applied_fee_rule_id" uuid;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "fee_amount_cents" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "commission_bps" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "currency" varchar(3);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "expiry_notified_at" jsonb;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "expiry_extension_log" jsonb;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "listings" ADD CONSTRAINT "listings_applied_fee_rule_id_category_fees_id_fk" FOREIGN KEY ("applied_fee_rule_id") REFERENCES "public"."category_fees"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> Effective-date support for fees and platform settings
ALTER TABLE "category_fees" ADD COLUMN IF NOT EXISTS "effective_from" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "category_fees" ADD COLUMN IF NOT EXISTS "effective_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "platform_configs" ADD COLUMN IF NOT EXISTS "effective_from" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "platform_configs" ADD COLUMN IF NOT EXISTS "effective_until" timestamp with time zone;--> statement-breakpoint

--> New operational permissions
INSERT INTO "public"."permissions" ("key", "label", "description")
VALUES
  ('users:manage_internal', 'Manage internal users', 'Can create and manage internal staff accounts'),
  ('seller:verify', 'Verify sellers', 'Can approve, reject and suspend seller verification requests'),
  ('listings:review', 'Review listings', 'Can review and moderate marketplace listings'),
  ('reports:export_pdf', 'Export PDF reports', 'Can export reports to PDF'),
  ('settings:financial', 'Manage financial settings', 'Can update fees, commission and financial feature toggles'),
  ('audit_logs:read', 'Read audit logs', 'Can view immutable audit logs')
ON CONFLICT ("key") DO NOTHING;

--> Default permission sets for new internal roles
INSERT INTO "public"."role_permissions" ("role", "permission_id")
SELECT 'listing_review_officer', "id" FROM "public"."permissions"
WHERE "key" IN ('admin:access', 'listings:read', 'listings:moderate', 'listings:review', 'seller:verify')
ON CONFLICT ("role", "permission_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "public"."role_permissions" ("role", "permission_id")
SELECT 'seller_verification_officer', "id" FROM "public"."permissions"
WHERE "key" IN ('admin:access', 'users:read', 'seller:verify')
ON CONFLICT ("role", "permission_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "public"."role_permissions" ("role", "permission_id")
SELECT 'finance_officer', "id" FROM "public"."permissions"
WHERE "key" IN ('admin:access', 'reports:read', 'reports:export_pdf', 'payouts:read', 'payouts:manage', 'orders:read')
ON CONFLICT ("role", "permission_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "public"."role_permissions" ("role", "permission_id")
SELECT 'support_officer', "id" FROM "public"."permissions"
WHERE "key" IN ('admin:access', 'users:read', 'listings:read', 'orders:read')
ON CONFLICT ("role", "permission_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "public"."role_permissions" ("role", "permission_id")
SELECT 'auditor', "id" FROM "public"."permissions"
WHERE "key" IN ('admin:access', 'reports:read', 'audit_logs:read')
ON CONFLICT ("role", "permission_id") DO NOTHING;

--> Backfill category_conditions with the original generic condition set so
--> existing categories continue to expose a condition selector.
--> Business-approved category-specific mappings can be configured afterward.
INSERT INTO "public"."category_conditions" ("category_id", "code", "label", "sort_order")
SELECT c.id, v.code, v.label, v.sort_order
FROM "public"."categories" c
CROSS JOIN (VALUES
  ('new_with_tags', 'New with tags', 1),
  ('like_new', 'Like new', 2),
  ('good', 'Good', 3),
  ('fair', 'Fair', 4),
  ('poor', 'Poor', 5)
) AS v(code, label, sort_order)
ON CONFLICT ("category_id", "code") DO NOTHING;
