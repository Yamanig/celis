# Changelog

All notable changes to Celis will be documented in this file.

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
