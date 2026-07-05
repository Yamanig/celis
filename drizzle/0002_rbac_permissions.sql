-- Permissions table
CREATE TABLE IF NOT EXISTS "public"."permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" text NOT NULL UNIQUE,
  "label" text NOT NULL,
  "description" text
);

-- Role-permissions mapping
CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "role" text NOT NULL,
  "permission_id" uuid NOT NULL REFERENCES "public"."permissions"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_role_permissions_unique"
  ON "public"."role_permissions" ("role", "permission_id");

-- Seed permissions
INSERT INTO "public"."permissions" ("key", "label", "description")
VALUES
  ('admin:access', 'Access admin area', 'Can log into the admin dashboard'),
  ('users:read', 'View users', 'Can view the user list'),
  ('users:manage', 'Manage users', 'Can change user roles, verification and super-admin status'),
  ('listings:read', 'View listings', 'Can view listings in admin'),
  ('listings:moderate', 'Moderate listings', 'Can approve, reject and change listing status'),
  ('categories:manage', 'Manage categories', 'Can create and edit categories'),
  ('orders:read', 'View orders', 'Can view orders'),
  ('orders:manage', 'Manage orders', 'Can update order status'),
  ('payouts:read', 'View payouts', 'Can view payouts'),
  ('payouts:manage', 'Manage payouts', 'Can retry and complete payouts'),
  ('reports:read', 'View reports', 'Can view financial reports and ledger'),
  ('settings:manage', 'Manage settings', 'Can update platform settings and role permissions'),
  ('reviews:moderate', 'Moderate reviews', 'Can remove inappropriate reviews')
ON CONFLICT ("key") DO NOTHING;

-- Map admin role to operational permissions
INSERT INTO "public"."role_permissions" ("role", "permission_id")
SELECT 'admin', "id" FROM "public"."permissions"
WHERE "key" IN (
  'admin:access',
  'users:read',
  'users:manage',
  'listings:read',
  'listings:moderate',
  'categories:manage',
  'orders:read',
  'orders:manage',
  'payouts:read',
  'payouts:manage',
  'reports:read',
  'reviews:moderate'
)
ON CONFLICT ("role", "permission_id") DO NOTHING;

-- Map super_admin role to all permissions
INSERT INTO "public"."role_permissions" ("role", "permission_id")
SELECT 'super_admin', "id" FROM "public"."permissions"
ON CONFLICT ("role", "permission_id") DO NOTHING;
