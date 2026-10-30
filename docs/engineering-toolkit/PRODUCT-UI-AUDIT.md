# HANSAN V3 — Product UI Audit

Audit of the current repository state. No application code modified.

## Implemented routes

### HQ (`HEADQUARTER (HQ)`, port 3000)
- `/` landing page (Sign in -> /login, HQ overview -> /hq).
- `/login` sign-in form (refined: per-field validation, password visibility, dev gating, metadata).
- `/hq` overview inside application shell (sidebar, header, mobile drawer). Honest EmptyState (no fake metrics).
- `/api/health`, `/api/auth/sign-in` (demo session).

### POS (`POS`, port 3001)
- `/` order terminal inside POSShell (menu grid, cart, qty controls, checkout, result/error states; in-memory only, labeled).
- `/login` sign-in (refined parity).
- `/api/health`, `/api/auth/sign-in`, `/api/orders` (in-memory idempotent order creation).

### STAFF (`STAFF`, port 3002)
- `/` landing (note: copy says "Point of Sale operations", likely stale).
- `/login` sign-in (refined parity).
- `/hq` overview inside StaffShell.
- `/hq/kitchen` Kitchen KDS (demo tickets, status transitions, empty states).
- `/hq/bar` Bar KDS (isolated station, demo tickets).
- `/api/health`, `/api/auth/sign-in`.

## Shared components
- `src/components/ui`: Button, Input (with trailing slot), Alert, Card(+Header/Title/Description), Section, PageHeader, EmptyState, Badge.
- Shells: HQShell, POSShell, StaffShell.

## Demo-only behavior
- All authentication is dev/demo (hardcoded `hansan-dev` password, dev session secret fallback).
- POS orders are in-memory and not persisted; server recomputes totals; idempotency key prevents duplicates in-process.
- KDS tickets are local demo data; no real-time sync.
- Overview cards show EmptyState, not metrics.

## Tests
- POS: `tests/pos-order.test.ts` (3 tests) PASS.
- HQ/STAFF: no test suites configured.

## Validation (latest run)
- HQ: lint PASS, typecheck PASS.
- POS: lint PASS, typecheck PASS, tests 3/3 PASS.
- STAFF: lint PASS, typecheck PASS.

## Unverified claims (no browser/screenshot tooling)
- Pixel-level visual QA, mobile viewport rendering, color contrast, and keyboard interaction were code-verified only.
- No end-to-end browser tests exist.

## Known issues
- STAFF landing copy says "Point of Sale operations" (stale, likely should be Staff).
- Middleware `WORKSPACE_ROOTS` only includes `/hq`; STAFF KDS routes under `/hq/*` are protected.
- `@supabase/*` declared in all three package.json but unused in code.
- No root .gitignore; subprojects ignore their own node_modules/.next.
