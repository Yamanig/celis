DROP INDEX IF EXISTS "idx_categories_active";

ALTER TABLE "categories"
  DROP COLUMN IF EXISTS "is_active";
