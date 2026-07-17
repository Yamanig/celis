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

## Validation & Errors

Rules:

- Use Zod for user input.
- Validate route params, search params, and form data.
- Keep validation close to the server function or shared when reused.
- Return clear user-facing errors for recoverable marketplace actions.
- Do not leak secrets, database internals, or stack traces.
- Payment/payout errors need enough logging/audit context for support.
