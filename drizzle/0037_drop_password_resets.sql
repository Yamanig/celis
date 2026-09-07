-- 0037_drop_password_resets.sql
--
-- SEC-1: the custom password-reset flow (requestPasswordReset returned the raw
-- token in the HTTP response → account takeover) is removed. Password reset now
-- goes through a WhatsApp OTP verified by Supabase Auth, so this table and its
-- server functions are gone.
--
-- Apply by hand (the Drizzle journal is desynced — see the audit DB-3):
--   psql "$DIRECT_URL" -f drizzle/0037_drop_password_resets.sql

DROP TABLE IF EXISTS "public"."password_resets";
