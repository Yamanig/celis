---
name: admin-rbac-development
description: Use when changing Celis admin pages, RBAC, roles, permissions, role-permissions, audit logs, moderation decisions, admin tables, admin charts, admin settings, or server-side authorization.
---

# Admin, RBAC & Audit Development

## Required Reads

- `AGENTS.md`
- `docs/domain/marketplace.md`
- `docs/frontend/ui.md`

## Rules

- Server-side RBAC is the source of truth.
- Admin tables must paginate/filter/search on the server.
- Reuse admin table, page header, status badge, and confirmation dialog patterns.
- Role, permission, moderation, status, and destructive actions require confirmation dialogs.
- Sensitive admin actions should be audit-friendly.
- Do not add unbounded dashboard aggregates.

## Verification

Run:

```bash
pnpm typecheck
```
