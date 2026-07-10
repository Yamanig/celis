## Product Rules

- Read `somalia-p2p-marketplace-prd.md` before marketplace/domain changes.
- Read `celis-design-system.md` before UI/design changes.
- Listing, order, payment, payout, package, moderation, RBAC, and audit-log flows are high-risk.

## Technical Rules

- Do not edit `app/routeTree.gen.ts` manually.
- Keep route files and server files small; split large files into components, query modules, mutation modules, and dialogs.
- Use Drizzle ORM and schema types; avoid raw SQL unless documented.
- Use Zod validation for user input.
- Admin tables must paginate/filter/search on the server.
- Use confirmation dialogs for destructive, financial, moderation, RBAC, status, package, and payout actions.
- Server-side RBAC is the source of truth.

## Verification

- Run `pnpm typecheck` after TypeScript edits.
- Run `pnpm build` for significant route/UI changes.
- Run `pnpm lint` when practical.
