ALTER TYPE "user_role" ADD VALUE 'listing_review_and_verification_officer';--> statement-breakpoint

-- Seed default permissions for the combined Listing Review & Verification Officer role.
INSERT INTO role_permissions (role, permission_id)
SELECT 'listing_review_and_verification_officer', id FROM permissions WHERE key IN (
  'admin:access',
  'listings:read',
  'listings:moderate',
  'seller:verify',
  'users:read'
)
ON CONFLICT DO NOTHING;