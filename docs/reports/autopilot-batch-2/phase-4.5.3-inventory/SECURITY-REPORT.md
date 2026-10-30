# HANSAN V3 — Phase 4.5.3 Security Report

## Controls
- All routes enforce auth + RBAC (write: owner/admin/manager/developer).
- Tenant isolation via resolveAccess (org/outlet).
- Stock adjustments require authorization.
- Movement ledger is append-only (no deletion).
- Audit logging not yet wired to inventory mutations.

## Risks
- Auth demo fallback still active in dev.
- No RLS (app-layer only).
- No unit conversion; quantities stored in base unit only.
- No automated integration tests.
