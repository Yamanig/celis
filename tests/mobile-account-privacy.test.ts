import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("drizzle/0032_private_account_profiles.sql", "utf8");
const hostedPolicy = readFileSync("public/privacy/index.html", "utf8");

test("mobile account tables no longer have anonymous read policies", () => {
  assert.match(migration, /DROP POLICY IF EXISTS "profiles_public_read"/);
  assert.match(migration, /DROP POLICY IF EXISTS "users_public_read"/);
  assert.match(migration, /profiles_owner_read[\s\S]*TO authenticated[\s\S]*id = auth\.uid\(\)/);
  assert.match(migration, /users_owner_read[\s\S]*TO authenticated[\s\S]*id = auth\.uid\(\)/);
});

test("public profile RPC exposes only the reviewed identity projection", () => {
  const signature = migration.match(/RETURNS TABLE \(([\s\S]*?)\)\nLANGUAGE/)?.[1] ?? "";
  for (const field of ["id uuid", "display_name text", "avatar_url text", "verified boolean", "member_since timestamptz"]) {
    assert.match(signature, new RegExp(field));
  }
  assert.doesNotMatch(signature, /phone|email|fcm|registration|address|seller_number/);
  assert.match(migration, /cardinality\(p_user_ids\) > 100/);
});

test("hosted policy is bilingual, public static content without placeholders", () => {
  assert.match(hostedPolicy, /id="english" lang="en"/);
  assert.match(hostedPolicy, /id="somali" lang="so"/);
  assert.match(hostedPolicy, /source-sha256:[a-f0-9]{64}/);
  assert.doesNotMatch(hostedPolicy, /placeholder|\bTBD\b|lorem|Company Name/i);
});

