# Changelog

## [v1.5.0] - 2026-09-02

### Added

- Migration `0033_category_active_flag.sql` adds a non-destructive
  `categories.is_active` flag (all existing rows stay active). Deactivated
  parents and subcategories drop out of browse, search, and the seller listing
  wizard while their listings stay intact; admins still see them.
- Admin Categories: per-row activate/deactivate switch, up/down reorder
  controls, and inline success/error feedback. Deactivating a category that
  still has listings or children asks for confirmation first. `updateCategory`
  now audits `category_status_changed` and `reorderCategory` audits
  `category_reordered`, both with old → new context. The expanded selection is
  preserved across all related actions.
- Admin Packages: Archive (soft-delete) and Delete row actions, both behind a
  confirm dialog that names the package. Delete is a hard delete only when no
  `seller_subscriptions` row references the package; referenced packages are
  blocked and the attempt is audited. Create/edit/status/archive/delete now
  write `audit_logs` events with the actor, timestamp, and old → new values.
- Bilingual Terms of Service at `/terms` (pending qualified legal review).
  Source lives at `public/terms/index.html` and is also reachable directly at
  `/terms/index.html`.
- `/privacy` and `/terms` now render inside the standard Celis header/footer
  shell with an English / Somali toggle (`LegalDocument` +
  `parseLegalDoc`), instead of as bare standalone HTML documents. The privacy
  body is still pulled from the generated `public/privacy/index.html`, so it
  stays the single source of truth.

### Fixed

- Admin Packages: the edit-dialog Active switch is now driven by freshly
  loaded data instead of a stale snapshot, routes through a confirmation, and
  reports success/failure. Required-field validation now surfaces on save.
  Mutating actions are gated on the `settings:manage` permission in the UI.
- The footer Privacy link 404'd: the trailing-slash `/privacy/` redirected to
  `/privacy`, which had no route and no static match. Added `app/routes/privacy.tsx`
  and `app/routes/terms.tsx`; the footer now links to both with `<Link>`. The
  Terms link previously pointed at the home page.

## [v1.4.0] - 2026-08-30

- Removed anonymous reads from the `profiles` and `users` base tables and added
  a bounded public marketplace identity RPC containing no contact information.
- Added the generated bilingual policy at `/privacy/` and linked it from the
  public footer.

## [v1.3.0] - 2026-08-25

- Replaced the category card list with an expandable tree that displays nested
  subcategories using hierarchy branches while retaining lazy child loading.
- Added an audited admin-only manual payment override for listings awaiting
  payment; confirmed overrides activate monetization and submit the listing for
  review without creating a fake provider transaction.

## [v1.2.0] - 2026-08-25

- Added a guarded admin renewal action that reactivates paid expired listings,
  records the new expiry, and writes a renewal audit event.
- Reworked category management into a root-category browser with subcategories
  loaded only after selection.
- Scoped Conditions and Fields actions to subcategory rows and added hierarchy
  counts so destructive actions remain safe.

## [v1.1.2] - 2026-08-25

- Corrected direct WaafiPay purchases to use the documented `WEB` channel.
- Allowed definitively failed idempotent payments to retry safely while preserving
  the same ledger record and merchant reference.
- Replaced raw Waafi provider codes with seller-safe payment messages.

## [v1.1.1] - 2026-08-25

- Exposed the local Vite payment API on the LAN for physical-device testing.
- Added credential-safe lifecycle logging for mobile listing-fee requests and Waafi gateway outcomes.

All notable changes to Celis will be documented in this file.

## [v1.1.0] - 2026-08-25

### Added

- Added an authenticated mobile listing-fee endpoint that validates Supabase
  bearer tokens, listing ownership, server-side pricing, and idempotency before
  initiating WaafiPay.
- Added migration `0031_unpaid_listings_stay_draft.sql` to prevent unpaid
  listings from entering review or becoming active.

## [v1.0.1] - 2026-08-25

### Changed

- Reorganized Admin → Settings into five responsive tabs for fees, WaafiPay,
  features and payment methods, listing pricing tiers, and audit information.
- Removed the route-wide settings fetch and added permission-checked,
  section-scoped loading when each tab is selected.
- Replaced the WaafiPay loading message with a form-shaped skeleton, ensured
  successful gateway saves close the confirmation dialog, and added a Fees-tab
  save action.

## [v1.0.0] - 2026-08-25

### Added

- Added an encrypted `payment_gateways` schema and migration for server-managed WaafiPay credentials.
- Added audited Admin → Settings configuration for sandbox/production endpoints, enablement, timeouts, and masked credential replacement.
- Added a server-only Waafi `API_PURCHASE` client with Somali wallet normalization, bounded timeouts, and strict approval parsing.
- Replaced the simulated listing-fee approval path with a real server-initiated Waafi purchase and atomic payment/listing transition.
- Added wallet-payment idempotency, invoice, provider-response, error, and reconciliation fields in migration `0030_wallet_payment_reconciliation.sql`.
- Added focused tests for credential encryption, wallet normalization, and Waafi success-state validation.
- Added `docs/backend/waafi-payments.md` describing configuration, migration, security boundaries, and remaining payment-workflow requirements.

### Security

- Waafi credentials are encrypted with AES-256-GCM using `PAYMENT_CREDENTIALS_ENCRYPTION_KEY` and are never returned to clients or written to audit metadata.
- Provider code `2001` alone is not treated as payment approval; `APPROVED` state and a transaction ID are also required.
- Payment amounts are calculated server-side, returned provider amounts must match, and ambiguous timeouts remain pending reconciliation rather than being marked failed.

## [v0.1.2] - 2026-07-31

### Added

- **FCM Push Notifications**: Firebase Admin SDK integration for remote push notifications.
  - `lib/fcm.ts`: helper module with `sendPushToUser()`, `sendPushToToken()`, and automatic invalid-token cleanup.
  - `scripts/send-test-fcm.ts`: CLI test sender (self-contained, reads `profiles.fcm_token`).
  - `FIREBASE_SERVICE_ACCOUNT` env var (JSON string or file path).
- **Listing approval/rejection pushes**: `approveListing()` and `rejectListing()` now send FCM push notifications to the seller in addition to in-app notifications.
- **Chat message push (DB trigger + job queue)**:
  - Migration `0028_notification_jobs.sql`: `notification_jobs` table + `enqueue_chat_notification()` trigger on `messages` INSERT.
  - `scripts/process-notification-jobs.ts`: background worker that polls `notification_jobs` and sends FCM pushes via Firebase Admin.
  - Push goes to the receiver only. Firebase credentials never exposed to mobile.
- **`fcm_token` column** added to Drizzle `profiles` schema.

### Changed

- Updated `.env.example` with `FIREBASE_SERVICE_ACCOUNT` documentation.
- Updated `docs/fcm-test-sender.md` with usage instructions.
- Added `pnpm cron:process-notifications` and `pnpm notifications:test` scripts.

### Deferred

- Presence-based chat push suppression (pushes currently send even if receiver is viewing the chat).
- Notification preferences gating (toggles exist in mobile UI but pushes always send for now).

## [v0.1.1] - 2026-07-17

### Fixed

- Reduced admin content gutter and removed the centered max-width wrapper so pages use the remaining width when the sidebar is expanded or collapsed.
- Aligned the home route skeleton with the real full-bleed hero layout and changed admin pending UI so static sidebar chrome renders immediately while content loads.
- Fixed search filters duplicate `CategoryListItem` type import that broke Vite React Babel transforms.
- Removed duplicate public header Account/Dashboard actions by keeping them inside the signed-in account dropdown.
- Fixed route loading skeletons so public pages use page-specific placeholders and admin loading keeps the sidebar shell instead of flashing a standalone content skeleton.

## [v0.1.0] - 2026-07-10

### Added

- Added the Celis AI guidance system with `AGENTS.md`, `.ai` rules, product/design/domain context, and documentation scaffold.
- Added marketplace, Drizzle/Postgres, TanStack Start, admin/RBAC, payments/payouts, forms/dialogs/tables, storage, migrations, and listing-expiry documentation.
- Added local project skills for TanStack Start, Drizzle/Postgres, marketplace domain work, admin/RBAC, and payments/payouts.
- Added a shared searchable combobox control and replaced select controls across marketplace and admin forms/filters.
- Added route-level pending skeletons, including admin-specific table skeletons that render inside the admin shell.
- Added an admin listing detail page for moderation review.
- Added a collapsible desktop admin sidebar with persisted icon-only mode.
- Added shared image URL optimization for Supabase Storage render endpoints.

### Changed

- Consolidated narrowly split docs into compact domain, backend, frontend, and operations guides to reduce redundant files.
- Updated the public app header to reduce crowding by moving account actions into a dropdown.
- Improved admin table pagination and removed `page=1` from clean first-page URLs.
- Simplified admin listing filters by removing duplicate status filter controls.
- Changed listing submission success messaging to make pending review clear instead of implying immediate approval.
- Updated dashboard listing links so only active listings link to public detail pages.
- Improved listing card, gallery, and upload image loading states.

### Fixed

- Disabled async buttons while click handlers are pending to reduce accidental duplicate submissions.
- Added confirmation before approving admin listings.
- Fixed admin pending navigation so public appbar/footer skeletons do not appear in admin.
- Fixed admin pending skeleton layout so it no longer creates an extra sidebar offset.
- Fixed admin listing detail routing so `/admin/listings/:id` renders as its own admin page.

### Technical Debt & Notes

- Existing large route/server files are documented as refactor targets and should be split incrementally before more behavior is added.
- Production builds still report large chunk warnings and an existing `audit.server.ts` mixed dynamic/static import warning.
