---
name: drizzle-postgres-development
description: Use when changing Celis Drizzle ORM schema, Postgres migrations, query composition, transactions, indexes, seed scripts, database-backed list endpoints, or server-side pagination/filtering/searching.
---

# Drizzle & Postgres Development

## Required Reads

- `AGENTS.md`
- `docs/backend/architecture.md`
- `docs/domain/marketplace.md`

## Rules

- Use Drizzle ORM and schema types.
- Avoid raw SQL unless documented.
- Return only fields needed by the UI.
- Use server-side pagination/filtering/searching for admin tables and marketplace search.
- Use transactions for order, payment, payout, package, moderation, and RBAC mutations.
- Add indexes for repeated filters, searches, and sorts.
- Commit schema and migration changes together.

## Verification

Run the relevant command:

```bash
pnpm db:generate
pnpm typecheck
```
