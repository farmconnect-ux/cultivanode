# Contributing

## Workflow per feature
1. Read the relevant docs and the requirements matrix row.
2. Database first: a migration with RLS, grants and pgTAP tests (never a table without RLS).
3. Server logic (database functions / Edge Functions) and shared Zod schemas in `packages/shared`.
4. Web UI, then mobile UI, using the shared design tokens and translation keys (no hard-coded copy).
5. Loading, empty, error and success states; accessibility (labels, focus, 48px targets, contrast).
6. Run `npm run typecheck`, `npm run lint`, `npm run test`, `npm run db:test`, `npm run build`.
7. Update docs and `docs/requirements-matrix.md` in the same change.

## Rules
- No `any` (isolate and explain if truly needed). Small functions, explicit types.
- No hard-coded crop rules, role permissions, commissions, cancellation rules or provider credentials.
- Never trust client-supplied ids, roles, prices, commissions, payment or verification status.
- Brand name, tagline and logo come from `packages/shared/src/brand.ts`.
- Enum lists come from `database.types.ts`; regenerate after schema changes.
- An external service without credentials gets an adapter plus a mock, not placeholder logic scattered in code.
- Commit messages: imperative, short subject, body explaining why.
