# Frontend UI

This guide covers TanStack routing/pages, listing UI, admin UI, forms, dialogs, tables, and the design-system pointer.

## Routing & Pages

Key files:

- `app/router.tsx`
- `app/routes/**`
- `app/routeTree.gen.ts`

Rules:

- Do not edit `app/routeTree.gen.ts` manually.
- Keep route files as route shells plus page composition.
- Move large sections into components.
- Move data queries/mutations into server modules.
- Lazy-load secondary panels and expensive route data.

## Listings UI

Key files:

- `app/components/listings/listing-card.tsx`
- `app/components/listings/listing-grid.tsx`
- `app/components/listings/listing-wizard.tsx`
- `app/components/listings/search-filters.tsx`
- `app/components/listings/payment-modal.tsx`
- `app/components/listings/image-uploader.tsx`
- `app/components/listings/image-gallery.tsx`

Rules:

- Listing cards should show clear price, title, image, location, and seller context.
- Search filters should map to server-side query parameters.
- Listing wizard sections should be split if the file grows.
- Payment modal changes are high-risk and require docs/changelog updates.

## Admin UI

Key files:

- `app/routes/admin/**`
- `app/components/admin/admin-table.tsx`
- `app/components/admin/confirm-dialog.tsx`
- `app/components/admin/status-badge.tsx`
- `app/components/admin/admin-shell.tsx`
- `app/components/admin/admin-chart.tsx`

Rules:

- Reuse admin table, status badge, confirmation dialog, and page header components.
- Admin tables must use server-side pagination/filtering for real data.
- Destructive, moderation, RBAC, package, payment, payout, and status actions require confirmation.
- Admin charts should load scoped data and avoid unbounded aggregates.

## Forms, Dialogs & Tables

Rules:

- Use existing UI primitives.
- Validate user input with Zod on the server.
- Keep long forms split into sections.
- Dialogs must name the record and consequence.
- Use `app/components/admin/confirm-dialog.tsx` or an equivalent shared confirmation pattern for high-risk actions.
- Server-side pagination/filtering is required for large datasets.
- Empty states, pagination, status badges, and row actions should be reusable.

## Design System

The full design source is `celis-design-system.md`.

Rules:

- Read `celis-design-system.md` before UI changes.
- Reuse established tokens, components, motion, and layout rules.
- Do not introduce another design language.
- Keep admin UI dense and listing UI marketplace-friendly.
