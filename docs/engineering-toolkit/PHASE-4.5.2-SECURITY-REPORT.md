# HANSAN V3 — Phase 4.5.2 Security Report

## Controls
- All routes enforce auth + RBAC (owner/admin/manager/developer for mutations; broader read).
- Tenant isolation via resolveAccess (org-scoped queries).
- Server-side price validation (nonnegative).
- Station assignment validated server-side (kitchen/bar enum).
- No client-trusted prices/station/ownership.
- Historical order snapshots preserved (order_items stores name/price/qty/station at order time).

## Risks
- Auth demo fallback still active in dev.
- No RLS (app-layer only).
- POS still uses hardcoded MENU (not yet wired to catalog).
- Outlet config not yet enforced in POS (effective price resolution exists in service but not called by POS).
