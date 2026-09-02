import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const categoriesSchema = readFileSync("app/db/schema/categories.ts", "utf8");
const categoriesServer = readFileSync("app/server/categories.server.ts", "utf8");
const adminServer = readFileSync("app/server/admin.server.ts", "utf8");
const adminFunctions = readFileSync("app/server/admin.functions.ts", "utf8");
const migration = readFileSync("drizzle/0033_category_active_flag.sql", "utf8");
const migrationDown = readFileSync(
  "drizzle/0033_category_active_flag.down.sql",
  "utf8"
);
const categoriesRoute = readFileSync("app/routes/admin/categories.tsx", "utf8");

// FR-01 — hierarchical category & subcategory navigation

test("FR-01 migration adds a non-destructive is_active flag", () => {
  assert.match(
    migration,
    /ALTER TABLE "categories"\s+ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL/
  );
  assert.match(migration, /CREATE INDEX IF NOT EXISTS "idx_categories_active"/);
  assert.match(migrationDown, /DROP COLUMN IF EXISTS "is_active"/);
});

test("FR-01 categories schema declares is_active with a safe default", () => {
  assert.match(
    categoriesSchema,
    /isActive:\s*boolean\("is_active"\)\.notNull\(\)\.default\(true\)/
  );
});

test("FR-01 public category reads hide deactivated (sub)categories", () => {
  // Seller listing wizard + browse/search go through these two helpers.
  assert.match(
    categoriesServer,
    /getRootCategories[\s\S]*?isNull\(categories\.parentId\)[\s\S]*?eq\(categories\.isActive,\s*true\)/
  );
  assert.match(
    categoriesServer,
    /getChildCategories[\s\S]*?eq\(categories\.parentId,\s*parentId\)[\s\S]*?eq\(categories\.isActive,\s*true\)/
  );
});

test("FR-01 admin category list still surfaces inactive rows with their status", () => {
  assert.match(adminServer, /getAdminCategories[\s\S]*?isActive:\s*r\.category\.isActive/);
});

test("FR-01 status changes and reorders are audited with old -> new context", () => {
  assert.match(adminServer, /action:\s*"category_status_changed"/);
  assert.match(adminServer, /previousStatus:\s*existing\.isActive\s*\?\s*"active"\s*:\s*"inactive"/);
  assert.match(adminServer, /export async function reorderCategory/);
  assert.match(adminServer, /action:\s*"category_reordered"/);
  assert.match(adminFunctions, /export const reorderAdminCategory/);
  assert.match(adminFunctions, /isActive:\s*z\.boolean\(\)\.optional\(\)/);
});

test("FR-01 admin UI exposes activate/deactivate, reorder, and keeps expansion", () => {
  assert.match(categoriesRoute, /handleToggleActive/);
  assert.match(categoriesRoute, /handleReorder/);
  assert.match(categoriesRoute, /reorderAdminCategory/);
  // Expand/collapse stays keyboard reachable and announced.
  assert.match(categoriesRoute, /aria-expanded=\{selected\}/);
  assert.match(categoriesRoute, /aria-controls=\{`category-panel-\$\{category\.id\}`\}/);
  // Related actions only re-run the loader; they never clear the URL selection.
  assert.doesNotMatch(
    categoriesRoute,
    /categoryId:\s*undefined[\s\S]{0,40}(applyStatus|handleReorder|handleSubmit)/
  );
});

test("FR-01 deletion stays blocked while listings or children exist", () => {
  assert.match(adminServer, /Cannot delete a category that has listings/);
  assert.match(adminServer, /Cannot delete a category that has subcategories/);
});
