import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adminFunctions = readFileSync("app/server/admin.functions.ts", "utf8");
const sellerPackages = readFileSync("app/server/seller-packages.server.ts", "utf8");
const packagesRoute = readFileSync("app/routes/admin/packages.tsx", "utf8");

// FR-02 — listing package status & management

test("FR-02 package create/update/status transitions are all audited", () => {
  assert.match(sellerPackages, /action:\s*"package_created"/);
  assert.match(sellerPackages, /action:\s*"package_updated"/);
  assert.match(sellerPackages, /action:\s*"package_status_changed"/);
  assert.match(sellerPackages, /previousStatus:\s*existing\.isActive\s*\?\s*"active"\s*:\s*"inactive"/);
});

test("FR-02 archive is a soft delete that keeps subscription history", () => {
  assert.match(sellerPackages, /export async function archiveListingPackage/);
  assert.match(sellerPackages, /action:\s*"package_archived"/);
  // status flip only, row retained
  assert.match(
    sellerPackages,
    /archiveListingPackage[\s\S]*?set\(\{\s*isActive:\s*false/
  );
});

test("FR-02 hard delete is blocked for referenced packages and logs the attempt", () => {
  assert.match(sellerPackages, /export async function deleteListingPackage/);
  assert.match(
    sellerPackages,
    /from\(sellerSubscriptions\)\s*\.where\(eq\(sellerSubscriptions\.packageId,\s*id\)\)/
  );
  assert.match(sellerPackages, /if\s*\(referenceCount\s*>\s*0\)/);
  assert.match(sellerPackages, /action:\s*"package_delete_blocked"/);
  assert.match(sellerPackages, /action:\s*"package_deleted"/);
});

test("FR-02 inactive packages cannot be purchased or assigned", () => {
  assert.match(sellerPackages, /Cannot assign an inactive package/);
  // Public purchase list is active-only + inside its effective window.
  assert.match(
    sellerPackages,
    /listListingPackages[\s\S]*?eq\(listingPackages\.isActive,\s*true\)/
  );
});

test("FR-02 admin routes expose permissioned edit/archive/delete with confirmation", () => {
  assert.match(adminFunctions, /export const archiveAdminListingPackage/);
  assert.match(adminFunctions, /export const deleteAdminListingPackage/);
  assert.match(
    adminFunctions,
    /archiveAdminListingPackage[\s\S]*?requirePermission\("settings:manage"\)/
  );
  assert.match(
    adminFunctions,
    /deleteAdminListingPackage[\s\S]*?requirePermission\("settings:manage"\)/
  );
  assert.match(packagesRoute, /ConfirmDialog/);
  assert.match(packagesRoute, /kind:\s*"delete"/);
  assert.match(packagesRoute, /kind:\s*"archive"/);
  // Active switch is driven by freshly-loaded data, not a stale snapshot.
  assert.match(packagesRoute, /editingLive/);
  assert.match(packagesRoute, /checked=\{editingLive\.isActive\}/);
});
