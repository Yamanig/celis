---
name: marketplace-domain-development
description: Use when working on Celis marketplace domain behavior: listings, listing lifecycle, sellers, buyers, orders, search/browse, listing wizard, listing interactions, seller packages, listing expiry, category behavior, or marketplace PRD implementation.
---

# Marketplace Domain Development

## Required Reads

- `AGENTS.md`
- `somalia-p2p-marketplace-prd.md`
- `docs/domain/marketplace.md`

## Rules

- Preserve documented marketplace lifecycle behavior.
- Listing/order/package status changes require confirmation dialogs.
- Search and browse must use scoped, paginated data.
- Do not mix listing detail, payment, image, seller, and interaction logic into one large route file.
- Update docs and changelog for marketplace behavior changes.

## Verification

Run:

```bash
pnpm typecheck
```
