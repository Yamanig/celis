# Backend Architecture

This guide covers Celis server functions, Drizzle/Postgres, Supabase storage, validation, and errors.

## Server Functions

Server/data behavior lives under `app/server`.

Patterns:

- `*.server.ts` for data access and server-side operations.
- `*.functions.ts` for server functions and mutations.

Rules:

- Keep server files focused.
- Split large server modules into query and mutation modules when needed.
- Validate user input with Zod.
- Enforce RBAC on the server.
- Use transactions for multi-record writes.
- Return only the data the UI needs.
- Avoid unbounded queries.

## Drizzle & Postgres

Key files:

- `app/db/schema/*.ts`
- `app/db/index.ts`
- `drizzle/*.sql`
- `drizzle/meta/*.json`
- `drizzle.config.ts`

Rules:

- Use Drizzle ORM and schema types.
- Avoid raw SQL unless documented.
- Add indexes for repeated filter/search/sort paths.
- Keep migrations committed with schema changes.
- Use transactions for order, payment, payout, package, moderation, and RBAC mutations.
- Update `docs/domain/marketplace.md` when tables or relationships change.

## Supabase Storage

The mobile account privacy boundary and limited public identity RPC are
documented in `docs/backend/mobile-account-privacy.md`.

Key files:

- `app/lib/supabase/client.ts`
- `app/lib/supabase/server.ts`
- `app/server/storage.server.ts`
- `app/server/storage.functions.ts`
- `scripts/create-storage-bucket.ts`
- `scripts/create-storage-bucket.mjs`

Rules:

- Keep storage operations in storage server modules.
- Validate file type, size, and ownership.
- Listing image changes should remain tied to listing ownership and moderation rules.
- Storage setup changes must update operations docs.

## Authentication

Two ways in, one account model. Both establish a Supabase session via the SSR
cookie client (`getSupabaseServerClient`).

- **Phone + WhatsApp OTP** (`app/server/phone-auth.server.ts`,
  `app/server/auth.functions.ts`): `requestPhoneOtp` → Supabase
  `signInWithOtp({ phone })` → the mobile team's `whatsapp-otp` "Send SMS" auth
  hook delivers the code over the self-hosted WAHA instance. `verifyPhoneOtp` →
  `verifyOtp({ type: "sms" })` → `ensureLocalUserRecord`. Supabase owns OTP
  generation, storage, expiry, verification, and its own rate limiting.
  Phone-only accounts have no `auth.users.email`; a synthetic
  `<digits>@celis.so` address is used for `public.users.email`.
- **Email + password** (`signIn` / `signUp`): retained for existing users.
  `signUp` still creates a confirmed account (no email verification step).
  After an email sign-in with no phone identity the user is routed to
  `/auth/add-phone` (soft, non-blocking — `AddPhoneBanner`).

**Password reset** (`/auth/forgot-password` → `/auth/verify-otp?mode=reset`):
the user proves control of the phone on their account via WhatsApp OTP, then
sets a new password (`resetPasswordWithOtp`). Responses are generic regardless
of whether the number has an account. The old token-in-response flow and the
`password_resets` table are removed (see `drizzle/0037_drop_password_resets.sql`).

**Rate limiting** (`app/server/rate-limit.server.ts`, `rate_limits` table):
`enforceRateLimit(key, { max, windowSec })` is a Postgres fixed-window counter
applied to `signIn` (per IP, per identifier, plus a failed-login backoff key),
`signUp`, and every OTP / reset endpoint. It fails open if the table is missing
(migration `0035` not yet applied).

`getCurrentUser()` exposes `hasVerifiedPhone` (a confirmed phone identity on the
Supabase auth user) alongside the app-level `phone`.

## Validation & Errors

Rules:

- Use Zod for user input.
- Validate route params, search params, and form data.
- Keep validation close to the server function or shared when reused.
- Return clear user-facing errors for recoverable marketplace actions.
- Do not leak secrets, database internals, or stack traces.
- Payment/payout errors need enough logging/audit context for support.
