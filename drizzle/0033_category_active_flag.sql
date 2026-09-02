-- FR-01: hierarchical category navigation — per-category activation state.
--
-- Additive and non-destructive: every existing category is marked active so
-- current browse, search, seller listing, and admin behaviour is unchanged.
-- Deactivating a (sub)category hides it from the seller listing wizard and the
-- public browse/search surfaces while leaving its existing listings intact.

ALTER TABLE "categories"
  ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_categories_active"
  ON "categories" ("is_active");
