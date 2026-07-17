CREATE TABLE IF NOT EXISTS "saved_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_saved_listings_user_listing" ON "saved_listings" USING btree ("user_id","listing_id");
--> statement-breakpoint

-- Ensure the listing-images storage bucket exists (used by both the web app
-- and the mobile app for listing photos). Idempotent.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('listing-images', 'listing-images', true, 10485760, '{image/png,image/jpeg,image/webp,image/gif}')
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint

-- Storage policies for the listing-images bucket.
-- These are additive grants and do not revoke any existing policies, so the
-- web app's existing upload/read behavior is preserved.
DROP POLICY IF EXISTS "listing_images_public_read" ON storage.objects;
CREATE POLICY "listing_images_public_read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'listing-images');
--> statement-breakpoint

DROP POLICY IF EXISTS "listing_images_auth_insert" ON storage.objects;
CREATE POLICY "listing_images_auth_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'listing-images');
--> statement-breakpoint

DROP POLICY IF EXISTS "listing_images_owner_delete" ON storage.objects;
CREATE POLICY "listing_images_owner_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'listing-images' AND owner = auth.uid());
