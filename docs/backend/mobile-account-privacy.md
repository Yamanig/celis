# Mobile Account Privacy Boundary

`drizzle/0032_private_account_profiles.sql` removes the legacy anonymous
`SELECT` policies from `public.profiles` and `public.users`.

Signed-in users retain owner-scoped reads. Marketplace browsing resolves public
attribution through `get_public_marketplace_profiles(uuid[])`. It accepts at
most 100 user IDs and returns only ID, display name, avatar URL, verification
status, and membership date. It excludes phone, email, wallet phone, push token,
business registration data, address, seller number, and security fields.

The public policy at `/privacy/` is generated from the mobile app's typed
`privacy.*` translation registry and `PRIVACY_POLICY_LAST_UPDATED` constant.
Regenerate it from `D:\celis mobile` with `npm run privacy:generate`; do not
hand-edit `public/privacy/index.html`.

## Live verification

- Anonymous `profiles?id,phone` reads return zero rows.
- Anonymous `users?id,email,wallet_phone` reads return zero rows.
- The public profile RPC succeeds and returns only `id`, `display_name`,
  `avatar_url`, `verified`, and `member_since`.

