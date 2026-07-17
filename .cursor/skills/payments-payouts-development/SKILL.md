---
name: payments-payouts-development
description: Use when changing Celis payment flows, payout flows, seller package purchases, payment modal behavior, financial status transitions, financial auditability, payment schema, payout schema, or any code under payments/payouts server modules.
---

# Payments & Payouts Development

## Required Reads

- `AGENTS.md`
- `docs/domain/marketplace.md`
- `somalia-p2p-marketplace-prd.md`

## Rules

- Financial actions require confirmation dialogs.
- Use transactions for multi-record financial writes.
- Preserve audit context for payment and payout changes.
- Do not hide financial failures behind generic errors.
- Keep payment/payout UI and server behavior consistent.
- Update docs and changelog for any financial behavior change.

## Verification

Run:

```bash
pnpm typecheck
```

Use focused tests when test tooling exists.
