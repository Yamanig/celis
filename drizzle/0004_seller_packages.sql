-- Seller type enum
CREATE TYPE "public"."seller_type" AS ENUM ('individual', 'shop');

-- Subscription status enum
CREATE TYPE "public"."subscription_status" AS ENUM ('active', 'cancelled', 'expired');

-- Add seller fields to profiles
ALTER TABLE "public"."profiles"
  ADD COLUMN "seller_type" "public"."seller_type" DEFAULT 'individual',
  ADD COLUMN "business_name" varchar(120),
  ADD COLUMN "business_logo_url" text,
  ADD COLUMN "business_registration_number" varchar(60),
  ADD COLUMN "business_address" text,
  ADD COLUMN "shop_slug" varchar(120);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_profiles_shop_slug"
  ON "public"."profiles" ("shop_slug")
  WHERE "shop_slug" IS NOT NULL;

-- Listing packages table
CREATE TABLE IF NOT EXISTS "public"."listing_packages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(120) NOT NULL,
  "description" text,
  "listing_allowance" integer NOT NULL,
  "duration_days" integer NOT NULL,
  "price" integer NOT NULL DEFAULT 0,
  "currency" varchar(3) NOT NULL DEFAULT 'USD',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Seller subscriptions table
CREATE TABLE IF NOT EXISTS "public"."seller_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "seller_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "package_id" uuid NOT NULL REFERENCES "public"."listing_packages"("id") ON DELETE CASCADE,
  "status" "public"."subscription_status" NOT NULL DEFAULT 'active',
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Seed a default unlimited shop package (admin can edit/disable later)
INSERT INTO "public"."listing_packages" ("name", "description", "listing_allowance", "duration_days", "price", "currency")
VALUES ('Shop Unlimited', 'Unlimited listings for 30 days', 999999, 30, 0, 'USD')
ON CONFLICT DO NOTHING;
