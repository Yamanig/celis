-- Phase 8: Row Level Security for the mobile (React Native / Expo) app.
--
-- The web app (D:\celis) accesses every table through the Drizzle `db` client,
-- which connects as the Supabase `postgres` (database owner) role. The postgres
-- role BYPASSES RLS, so enabling RLS here does NOT affect the web app.
--
-- These policies only govern access made with the Supabase anon / authenticated
-- key — i.e. the mobile app (and any direct API client). They implement the
-- model documented in celis-mobile/docs/mobile/supabase-direct-access.md:
--   * Public buyers may read safe active listing / category / review data.
--   * Authenticated users may read/write only their own rows.
--   * Sensitive admin/financial tables stay server-only (deny by default).

-- ────────────────────────────────
-- PUBLIC READ TABLES
-- ────────────────────────────────

ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON "categories"
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE "category_conditions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "category_conditions_public_read" ON "category_conditions"
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE "listing_reviews" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listing_reviews_public_read" ON "listing_reviews"
  FOR SELECT TO anon, authenticated USING (true);

-- Public seller-facing profile data (display name, phone, business info).
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON "profiles"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "profiles_owner_write" ON "profiles"
  FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users: publicly readable so listing detail can resolve seller contact +
-- verification status (seller contact info is intentionally public in this
-- marketplace). Owner-scoped write for self-service updates.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_public_read" ON "users"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "users_owner_write" ON "users"
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ────────────────────────────────
-- LISTINGS
-- ────────────────────────────────

ALTER TABLE "listings" ENABLE ROW LEVEL SECURITY;

-- Public buyers may browse active, non-expired listings only.
CREATE POLICY "listings_public_read" ON "listings"
  FOR SELECT TO anon, authenticated
  USING (
    status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Sellers may read all of their own listings (any status).
CREATE POLICY "listings_owner_read" ON "listings"
  FOR SELECT TO authenticated
  USING (seller_id = auth.uid());

-- Sellers may create draft / pending_review listings only under their own id.
CREATE POLICY "listings_owner_insert" ON "listings"
  FOR INSERT TO authenticated
  WITH CHECK (
    seller_id = auth.uid()
    AND status IN ('draft', 'pending_review')
  );

-- Sellers may update / delete only their own listings.
CREATE POLICY "listings_owner_write" ON "listings"
  FOR UPDATE TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "listings_owner_delete" ON "listings"
  FOR DELETE TO authenticated
  USING (seller_id = auth.uid());

-- ────────────────────────────────
-- BUYER-OWNED INTERACTION TABLES
-- ────────────────────────────────

ALTER TABLE "listing_interactions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listing_interactions_owner_all" ON "listing_interactions"
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE "saved_listings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_listings_owner_all" ON "saved_listings"
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ────────────────────────────────
-- NOTIFICATIONS (owner-scoped)
-- ────────────────────────────────

ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_owner_all" ON "notifications"
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ────────────────────────────────
-- SERVER-ONLY TABLES
-- RLS enabled, NO anon/authenticated policies => denied by default.
-- The web app's postgres role continues to bypass RLS, so behaviour is unchanged.
-- (auth_users lives in the Supabase auth schema, not public, so it is excluded.)
-- ────────────────────────────────

ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wallet_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payouts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform_configs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "listing_packages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "seller_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "password_resets" ENABLE ROW LEVEL SECURITY;
