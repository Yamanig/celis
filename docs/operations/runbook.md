# Operations Runbook

## Local Development

Commands:

```bash
pnpm dev
pnpm typecheck
pnpm build
pnpm lint
```

Database:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm db:push
```

Scripts:

```bash
# Bootstraps the super-admin. Credentials come from the environment — the
# script fails if ADMIN_EMAIL / ADMIN_PASSWORD are unset (ADMIN_PASSWORD must
# be 12+ chars). Never commit these; rotate any legacy admin@celis.so login.
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='<12+ char secret>' pnpm db:seed-admin

pnpm storage:create-bucket
pnpm cron:expire-listings
```

## Migrations & Seeding

Rules:

- Commit Drizzle schema and generated migrations together.
- Keep seed scripts deterministic.
- Document new tables in `docs/domain/marketplace.md`.
- Add indexes for repeated admin filters/search/sorts.

### Hand-applied migrations

The Drizzle journal is desynced (migrations `0019`–`0033` were applied out of
band), so `drizzle-kit migrate` is unreliable. Apply new `.sql` files directly:

```bash
psql "$DIRECT_URL" -f drizzle/0035_auth_rate_limits.sql
psql "$DIRECT_URL" -f drizzle/0036_audit_log_context.sql
psql "$DIRECT_URL" -f drizzle/0037_drop_password_resets.sql
# 0038 is high-risk (SECURITY DEFINER function bodies) — test on a branch DB
# first, then:
psql "$DIRECT_URL" -f drizzle/0038_harden_definer_functions.sql
```

Apply `0035` / `0036` **before or with** the code deploy — the auth rate
limiter and audit-context writer fail open only until the code notices the
table/columns are missing.

## Payment credentials encryption key rotation

`PAYMENT_CREDENTIALS_ENCRYPTION_KEY` (32+ chars, validated at boot) encrypts the
WaafiPay gateway secrets in `payment_gateways` with AES-256-GCM
(`app/server/payment-credentials.server.ts`). To rotate:

1. Generate a new key: `openssl rand -base64 48`.
2. Deploy a build that accepts **both** keys — try the new key first on decrypt,
   fall back to the old key (temporary `decryptPaymentCredential` change).
3. Re-encrypt every `payment_gateways` row with the new key (one-off script:
   read each credential via the dual-read path, write it back — the encrypt
   path already uses the new key).
4. Verify a test gateway call succeeds.
5. Remove the old key from the environment and drop the fallback branch.

Do this in a maintenance window; a gateway save/read during steps 2–3 is safe,
but a partial re-encryption leaves rows on mixed keys until step 3 completes.

## Listing Expiry Cron

Key file:

- `scripts/expire-listings.ts`

Rules:

- Expiry behavior must match listing lifecycle rules.
- Expiry changes can affect seller package value and marketplace trust.
- Log enough information to support audit/debugging.
- Test expiry logic with active, expired, and boundary-time listings when test tooling exists.
