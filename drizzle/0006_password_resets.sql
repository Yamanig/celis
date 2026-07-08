CREATE TABLE IF NOT EXISTS "public"."password_resets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar(255) NOT NULL,
  "token" varchar(255) NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_password_resets_token" ON "public"."password_resets"("token");
CREATE INDEX IF NOT EXISTS "idx_password_resets_email" ON "public"."password_resets"("email");
