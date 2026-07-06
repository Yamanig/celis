-- Audit log table
CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "action" text NOT NULL,
  "resource_type" text NOT NULL,
  "resource_id" text,
  "metadata" jsonb,
  "ip_address" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_actor"
  ON "public"."audit_logs" ("actor_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_resource"
  ON "public"."audit_logs" ("resource_type", "resource_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at"
  ON "public"."audit_logs" ("created_at");

-- Permission to read audit logs
INSERT INTO "public"."permissions" ("key", "label", "description")
VALUES (
  'audit:read',
  'View audit log',
  'Can view the audit log of platform changes'
)
ON CONFLICT ("key") DO NOTHING;

-- Grant audit:read to admin and super_admin
INSERT INTO "public"."role_permissions" ("role", "permission_id")
SELECT 'admin', "id" FROM "public"."permissions" WHERE "key" = 'audit:read'
ON CONFLICT ("role", "permission_id") DO NOTHING;

INSERT INTO "public"."role_permissions" ("role", "permission_id")
SELECT 'super_admin', "id" FROM "public"."permissions" WHERE "key" = 'audit:read'
ON CONFLICT ("role", "permission_id") DO NOTHING;
