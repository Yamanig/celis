# Celis Agent Guide

This is the root guide for AI agents working in Celis. Read this first.

## Project Snapshot

Celis is a Somalia P2P marketplace built with:

- Vite
- TanStack Start / TanStack Router
- React 19 RC
- Drizzle ORM
- Postgres / Supabase
- TanStack Query
- Radix UI
- Tailwind CSS 3
- Zod
- Framer Motion

Primary product sources:

- `somalia-p2p-marketplace-prd.md` - marketplace product requirements and business flows.
- `celis-design-system.md` - visual language, components, and design rules.

Do not replace these documents. Summarize and route to them from the maintained docs.

## Clone & Adapt Protocol

- Find the closest equivalent route, server function, query, component, form, table, dialog, or admin page before creating a new one.
- Duplicate the working pattern first, then adjust only the resource-specific details.
- Keep listing, search, admin, auth, payments, payouts, seller package, moderation, and RBAC flows consistent.
- Extract shared behavior instead of copy-pasting it a third time.
- Never edit `app/routeTree.gen.ts` manually.

## Living Docs Protocol

A change is incomplete until docs match the code.

Before finishing a change:

1. Review modified files.
2. Detect new routes, server functions, Drizzle schema, migrations, components, admin pages, forms, dialogs, tables, marketplace states, payment/payout behavior, or RBAC changes.
3. Update the relevant file under `docs/`.
4. Append a concise versioned entry to `CHANGELOG.md`.
5. Run the smallest useful verification command.

Use SemVer for `CHANGELOG.md`:

- **Major:** marketplace state-machine, payment/payout, auth/RBAC, schema, or destructive data architecture changes.
- **Minor:** new modules, routes, server functions, schema tables, admin pages, or reusable UI/data systems.
- **Patch:** fixes, refactors, UI tweaks, validation changes, docs-only updates.

## Test & Verification Enforcement

- Every behavior change needs an automated test or a clear note explaining why it could not be tested.
- Run `pnpm typecheck` after TypeScript edits.
- Run `pnpm build` for significant route, routing, or UI changes.
- Run `pnpm lint` when practical.
- For database changes, run the appropriate Drizzle command and document the migration.

## Performance First

- Do not load all listings, orders, users, payments, payouts, packages, or audit logs into route pages.
- Admin tables must paginate, search, filter, and sort on the server.
- Listing search and browse pages should request scoped result sets only.
- Use Drizzle `select` shapes to return only visible fields.
- Lazy-load charts, secondary tabs, hidden panels, and export data.
- Do not run expensive dashboard aggregates inside route render code without scoped queries, caching, or an explicit reason.

## File Size Discipline

- Route files over 500 lines are refactor targets.
- Server files over 500 lines are refactor targets.
- Files near or above 1,000 lines are unacceptable for new work.
- Existing large files are refactor targets, especially:
  - `app/routes/index.tsx`
  - `app/server/admin.server.ts`
  - `app/routes/listings.$id.tsx`
  - `app/components/listings/listing-wizard.tsx`
  - `app/server/listings.server.ts`
- Split large files into route shell, query module, mutation module, table component, form component, dialogs, and section components.

## Marketplace Safety

- Listing approval/rejection, order status changes, payout status changes, package changes, role/permission changes, payment operations, and destructive actions require confirmation dialogs.
- Payment and payout operations require auditability.
- Moderation actions must record enough context to reconstruct why a decision happened.
- RBAC must be enforced on the server, not only in UI navigation.
- Marketplace state transitions must match documented order/listing/payment lifecycle rules.

## Backend/Data Rules

- Use Drizzle ORM and schema types.
- Avoid raw SQL unless there is a documented reason.
- Use Zod validation for user input.
- Use transactions for multi-record writes, especially payment, payout, order, package, and moderation flows.
- Add indexes for repeated filter/search/sort paths.
- Keep Supabase storage operations in the storage server modules.

## Frontend Rules

- Route pages live under `app/routes`.
- Shared UI belongs under `app/components`.
- Admin UI patterns belong under `app/components/admin`.
- Listing UI patterns belong under `app/components/listings`.
- Use the existing Radix/Tailwind component system.
- Use reusable components for admin tables, filters, status badges, confirm dialogs, pagination, forms, and empty states.
- Keep URL/query state intentional; do not add shareable query strings unless the user workflow benefits.

## Product Context

Celis is a Somalia P2P marketplace. Core capabilities include browsing listings, seller flows, listing creation, packages, orders, payments, payouts, moderation, admin reporting, RBAC, and audit logs.

Audience:

- Buyers browsing marketplace listings.
- Sellers posting and managing listings.
- Admin/moderation staff reviewing users, listings, orders, payouts, and reports.
- Platform operators managing packages, configuration, roles, and auditability.

## Design Context

Read `celis-design-system.md` before UI work. Preserve the established brand, layout, tokens, component language, and motion rules.

## Documentation Map

- `CONTEXT.md` - compact domain glossary.
- `PRODUCT.md` - short product summary and links to the PRD.
- `DESIGN.md` - short design summary and links to the full design system.
- `docs/README.md` - maintained documentation index.
- `docs/domain/` - marketplace business concepts.
- `docs/backend/` - server functions, Drizzle, storage, validation, and errors.
- `docs/frontend/` - routing, listing UI, admin UI, forms/dialogs/tables, design system.
- `docs/operations/` - local development, migrations/seeding, listing expiry cron.
- `.cursor/skills/` - local project skills.
- `.ai/guidelines/` - compact rule files.

## Hot Paths

### Routing & App

| File | Role |
| :--- | :--- |
| `app/router.tsx` | Router setup |
| `app/routes/__root.tsx` | Root route |
| `app/routes/index.tsx` | Landing/home route |
| `app/routes/search.tsx` | Search route |
| `app/routes/browse.tsx` | Browse route |
| `app/routes/listings.$id.tsx` | Listing detail route |
| `app/routeTree.gen.ts` | Generated route tree; do not edit manually |

### Server/Data

| File | Role |
| :--- | :--- |
| `app/db/schema/*.ts` | Drizzle schema |
| `app/db/index.ts` | Database entrypoint |
| `app/server/listings.server.ts` | Listing data/server behavior |
| `app/server/admin.server.ts` | Admin data/server behavior |
| `app/server/payments.server.ts` | Payment behavior |
| `app/server/seller-packages.server.ts` | Seller package behavior |
| `app/server/storage.server.ts` | Storage behavior |
| `app/server/*.functions.ts` | Server functions/mutations |

### Admin UI

| File | Role |
| :--- | :--- |
| `app/routes/admin/**` | Admin pages |
| `app/components/admin/admin-table.tsx` | Admin table pattern |
| `app/components/admin/confirm-dialog.tsx` | Confirmation dialog |
| `app/components/admin/status-badge.tsx` | Status badge |
| `app/components/admin/admin-shell.tsx` | Admin shell |

### Listing UI

| File | Role |
| :--- | :--- |
| `app/components/listings/listing-card.tsx` | Listing card |
| `app/components/listings/listing-grid.tsx` | Listing grid |
| `app/components/listings/listing-wizard.tsx` | Listing creation wizard |
| `app/components/listings/search-filters.tsx` | Search filters |
| `app/components/listings/payment-modal.tsx` | Payment modal |
| `app/components/listings/image-uploader.tsx` | Image uploads |

## Skill Routing

Use the local skill before working in that area:

- TanStack Start/router/server functions: `.cursor/skills/tanstack-start-development/SKILL.md`
- Drizzle/Postgres/schema/query work: `.cursor/skills/drizzle-postgres-development/SKILL.md`
- Marketplace listings/orders/packages: `.cursor/skills/marketplace-domain-development/SKILL.md`
- Admin/RBAC/moderation/audit: `.cursor/skills/admin-rbac-development/SKILL.md`
- Payments/payouts/financial flows: `.cursor/skills/payments-payouts-development/SKILL.md`

## Do Not

- Do not edit `app/routeTree.gen.ts` manually.
- Do not create another one-off table, confirm dialog, status badge, or pagination system.
- Do not load all rows for admin pages.
- Do not hide marketplace status changes behind immediate action buttons.
- Do not change payment/payout behavior without docs, verification, and audit consideration.
- Do not ignore `somalia-p2p-marketplace-prd.md` or `celis-design-system.md` for domain/UI changes.
