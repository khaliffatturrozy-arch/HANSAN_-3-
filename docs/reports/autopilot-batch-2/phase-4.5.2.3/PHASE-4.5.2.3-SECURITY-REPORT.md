# HANSAN V3 — Phase 4.5.2.3 Security Report

## Controls
- All catalog routes enforce auth + RBAC (write: owner/admin/manager/developer).
- Tenant isolation via resolveAccess (org/outlet).
- Server-side price validation (nonnegative, Zod).
- Organization-level inactive items never sellable (filtered in getOutletCatalog).
- Historical order snapshots preserved.
- RLS NOT implemented (app-layer only) — documented limitation.

## Risks
- Auth demo fallback still active in dev.
- No RLS; app-layer bug could expose cross-tenant data.
- No rate limiting.
- No automated integration tests.
