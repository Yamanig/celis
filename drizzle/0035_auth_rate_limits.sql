-- 0035_auth_rate_limits.sql
--
-- SEC-5: sign-in / sign-up / password-reset / OTP endpoints had no rate
-- limiting or brute-force protection. enforceRateLimit() (app/server/
-- rate-limit.server.ts) keeps a fixed-window counter per key in this table.
--
-- Apply by hand (the Drizzle journal is desynced — see the audit DB-3):
--   psql "$DIRECT_URL" -f drizzle/0035_auth_rate_limits.sql

CREATE TABLE IF NOT EXISTS "public"."rate_limits" (
  "key" text PRIMARY KEY,
  "count" integer NOT NULL DEFAULT 0,
  "window_started_at" timestamptz NOT NULL DEFAULT now()
);

-- Lets a periodic cleanup drop stale rows cheaply.
CREATE INDEX IF NOT EXISTS "idx_rate_limits_window_started_at"
  ON "public"."rate_limits" ("window_started_at");
