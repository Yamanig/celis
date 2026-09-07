-- 0036_audit_log_context.sql
--
-- SEC-10: audit_logs recorded neither the request IP (the ip_address column was
-- always NULL) nor the user agent / request id. insertAuditLog() now populates
-- ip_address and these two new columns from the request context.
--
-- Apply by hand (the Drizzle journal is desynced — see the audit DB-3):
--   psql "$DIRECT_URL" -f drizzle/0036_audit_log_context.sql
-- or paste into the Supabase SQL editor.

ALTER TABLE "public"."audit_logs"
  ADD COLUMN IF NOT EXISTS "user_agent" text,
  ADD COLUMN IF NOT EXISTS "request_id" text;
