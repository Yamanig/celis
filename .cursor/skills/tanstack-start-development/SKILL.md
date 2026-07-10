---
name: tanstack-start-development
description: Use when working on Celis TanStack Start, TanStack Router, route files, loaders, server functions, generated route tree, TanStack Query integration, route-level data loading, route splitting, or Vite app behavior.
---

# TanStack Start Development

## Required Reads

- `AGENTS.md`
- `docs/frontend/ui.md`
- Relevant sibling route files

## Rules

- Do not edit `app/routeTree.gen.ts` manually.
- Keep route files as shells that compose components and server data.
- Move large UI sections into components.
- Move data access and mutations into `app/server`.
- Lazy-load secondary panels and expensive route data.
- Preserve product and design rules from `somalia-p2p-marketplace-prd.md` and `celis-design-system.md`.

## Verification

Run:

```bash
pnpm typecheck
```

Use `pnpm build` for significant routing/UI changes.
