# Marketplace Domain

This is the compact domain guide for Celis. The full product source is `somalia-p2p-marketplace-prd.md`.

## Core Terms

- **User:** Marketplace account, buyer, seller, admin, or platform staff depending on role.
- **Listing:** Marketplace item/service posted by a seller.
- **Category:** Listing classification.
- **Seller:** User who creates listings and may buy seller packages.
- **Buyer:** User browsing listings and initiating orders/payments.
- **Order:** Transactional record connecting buyer, seller, listing, and payment state.
- **Payment:** Charge or collection event.
- **Payout:** Seller disbursement event.
- **Seller package:** Paid package controlling seller listing capabilities and benefits.
- **Moderation review:** Admin review record for marketplace safety.
- **Audit log:** Durable trace of sensitive platform actions.
- **RBAC:** Roles, permissions, role-permissions, and server-enforced access controls.
- **Platform config:** Admin-managed marketplace settings.
- **Listing interaction:** User behavior such as views, saves, contacts, or similar engagement events.

## Listings

Key files:

- `app/db/schema/listings.ts`
- `app/db/schema/listing-reviews.ts`
- `app/db/schema/listing-interactions.ts`
- `app/server/listings.server.ts`
- `app/server/listings.functions.ts`
- `app/server/listing-interactions.functions.ts`
- `app/routes/listings.$id.tsx`
- `app/routes/sell.tsx`
- `app/routes/search.tsx`
- `app/routes/browse.tsx`
- `app/components/listings/**`
- `scripts/expire-listings.ts`

Rules:

- Search and browse must use scoped, paginated result sets.
- Listing creation should use Zod validation.
- Listing status changes require confirmation and audit consideration.
- Listing expiry behavior belongs in the documented cron path.
- Do not pack listing detail, payment, seller, image, and interaction logic into one large route file.

## Orders

Key files:

- `app/db/schema/orders.ts`
- `app/routes/admin/orders.tsx`
- `fig_3_1_order_state_machine.png`

Rules:

- Order state transitions must match the documented state machine.
- Status-changing actions require confirmation dialogs.
- Multi-record order updates should use transactions.
- Admin order tables must paginate/filter on the server.
- Order changes with financial impact must be audit-friendly.

## Payments & Payouts

Key files:

- `app/db/schema/payments.ts`
- `app/db/schema/payouts.ts`
- `app/server/payments.server.ts`
- `app/server/payments.functions.ts`
- `app/routes/admin/payouts.tsx`
- `app/components/listings/payment-modal.tsx`

Rules:

- Financial actions require confirmation dialogs.
- Financial actions should create or preserve audit context.
- Use transactions for multi-record updates.
- Do not hide failures behind generic UI states.
- Never perform payment/payout changes without updating docs and changelog.

## Seller Packages

Key files:

- `app/db/schema/seller-packages.ts`
- `app/server/seller-packages.server.ts`
- `app/routes/admin/packages.tsx`
- `app/lib/pricing.ts`

Rules:

- Package changes can affect seller access and marketplace revenue.
- Package create/update/delete actions require confirmation.
- Keep pricing and package display consistent across seller and admin surfaces.
- Document plan/package behavior changes.

## Moderation, RBAC & Audit

Key files:

- `app/db/schema/listing-reviews.ts`
- `app/db/schema/permissions.ts`
- `app/db/schema/role-permissions.ts`
- `app/db/schema/audit-logs.ts`
- `app/server/admin.server.ts`
- `app/server/admin.functions.ts`
- `app/server/audit.server.ts`
- `app/routes/admin/listings.tsx`
- `app/routes/admin/roles.tsx`
- `app/routes/admin/audit-log.tsx`

Rules:

- Approval/rejection actions require confirmation.
- Record enough context to understand why a moderation decision happened.
- Server-side authorization is the source of truth.
- Role/permission mutations require confirmation.
- Sensitive admin and financial actions should write audit logs.
- Audit log tables must paginate and filter on the server.
