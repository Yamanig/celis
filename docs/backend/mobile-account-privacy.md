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

The web app exposes that file at the clean `/privacy` URL through
`app/routes/privacy.tsx`. The route imports `public/privacy/index.html` with a
`?raw` import, pulls out the title and the two `<article>` bodies with
`parseLegalDoc` (`app/lib/legal-doc.ts`), and renders them inside the Celis site
chrome (`LegalDocument`) with an English / Somali toggle. The untouched source
file is still served verbatim at `/privacy/index.html`. Both paths therefore
reflect the same generated document; regenerating the file is the only step
needed to publish an update, provided it keeps the `<h1>` /
`<article id="english">` / `<article id="somali">` shape the parser expects.

The Terms of Service at `/terms` follows the same pattern (`app/routes/terms.tsx`
+ `public/terms/index.html`) but is authored in this repo, not generated.

## Live verification

- Anonymous `profiles?id,phone` reads return zero rows.
- Anonymous `users?id,email,wallet_phone` reads return zero rows.
- The public profile RPC succeeds and returns only `id`, `display_name`,
  `avatar_url`, `verified`, and `member_since`.

