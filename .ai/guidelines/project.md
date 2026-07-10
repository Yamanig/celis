# Living Docs Protocol

Every code change must update documentation and `CHANGELOG.md`.

Before finishing:

1. Review changed files.
2. Detect new routes, server functions, database schema, migrations, UI components, forms, tables, dialogs, admin pages, payment/payout flows, or RBAC changes.
3. Update the relevant `docs/` file.
4. Add a SemVer changelog entry.
5. Run the smallest relevant verification command.

SemVer:

- Major: marketplace state-machine, payment/payout, auth/RBAC, schema, or destructive data architecture changes.
- Minor: new modules, routes, server functions, schema tables, admin pages, reusable systems.
- Patch: fixes, refactors, validation changes, UI tweaks, docs-only changes.
