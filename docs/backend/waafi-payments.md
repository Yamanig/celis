# WaafiPay Server Integration

Celis stores WaafiPay merchant credentials in the `payment_gateways` table and calls Waafi only from server code. Browser and mobile clients never receive credentials or determine charge amounts.

## Mobile listing-fee endpoint

`POST /api/mobile/payments/listing-fee` accepts a seller's Supabase bearer
token, listing ID, wallet phone, and idempotency key. The server validates the
session and listing ownership, recalculates the fee from the stored listing
price, and then uses the encrypted Waafi credentials. Mobile clients never send
an amount or receive provider credentials.

For physical-device development, `npm run dev` binds Vite to the LAN. The mobile
API URL must use the development computer's reachable LAN address. Payment logs
use the `[mobile-listing-payment]` and `[wallet-payment]` prefixes and omit wallet
phone numbers and gateway credentials.

Migration `0031_unpaid_listings_stay_draft.sql` enforces the payment lifecycle
at the database boundary: `pending_paid` listings remain `draft`. The Waafi
payment transaction changes both `monetization_status` to `active` and listing
status to `pending_review`; only then can moderation begin.

## Configuration

Set `PAYMENT_CREDENTIALS_ENCRYPTION_KEY` to a long random server secret before saving gateway credentials. All deployed instances must use the same value. Rotating this key requires re-encrypting stored credentials.

Administrators with `settings:manage` configure WaafiPay under Admin → Settings. Merchant UID, API User ID, and API Key are encrypted independently with AES-256-GCM. Existing secrets are never returned; the admin UI receives masked suffixes only. Gateway changes create an audit-log record without secret values.

The approved endpoints are:

- Sandbox: `https://sandbox.waafipay.net/asm`
- Production: `https://api.waafipay.net/asm`

Changing to production disables the UI toggle until the administrator explicitly confirms and saves the live configuration.

## Purchase boundary

`app/server/waafi.server.ts` implements Waafi `API_PURCHASE` with `MWALLET_ACCOUNT`. A successful transport response is not sufficient. Celis accepts a payment only when:

- `responseCode` is `2001`;
- `params.state` is `APPROVED`;
- `params.transactionId` is present;
- the payment workflow reconciles the returned amount with the server-calculated charge.

Phone numbers are normalized to international Somali format without `+`. Requests use a bounded timeout. A timeout is ambiguous and must be reconciled before retrying; clients must not assume it failed.

## Migration

Apply `drizzle/0029_encrypted_payment_gateways.sql` and `drizzle/0030_wallet_payment_reconciliation.sql` through the normal reviewed migration process. The second migration adds idempotency, invoice, response-state, and reconciliation fields to the wallet ledger. Do not enable WaafiPay until the encryption key and encrypted credentials are configured.

## Security rules

- Never expose decrypted credentials in server-function return values, logs, audit metadata, or client bundles.
- Never accept the charge amount from a mobile or browser client.
- Persist an idempotency/reference record before initiating a charge.
- Mark a listing paid only after the server validates the provider response and amount.
- Treat provider timeouts and approved amount mismatches as `pending_reconciliation`; never offer an immediate retry.
- Use sandbox credentials for automated and manual integration testing.
