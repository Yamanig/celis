CREATE TYPE "public"."interaction_type" AS ENUM ('show_contact', 'request_callback');

CREATE TABLE IF NOT EXISTS "public"."listing_interactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "listing_id" uuid NOT NULL REFERENCES "public"."listings"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "type" "public"."interaction_type" NOT NULL,
  "phone" text,
  "description" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_listing_interactions_listing_id" ON "public"."listing_interactions"("listing_id");
CREATE INDEX IF NOT EXISTS "idx_listing_interactions_user_id" ON "public"."listing_interactions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_listing_interactions_type" ON "public"."listing_interactions"("type");
CREATE INDEX IF NOT EXISTS "idx_listing_interactions_created_at" ON "public"."listing_interactions"("created_at");
