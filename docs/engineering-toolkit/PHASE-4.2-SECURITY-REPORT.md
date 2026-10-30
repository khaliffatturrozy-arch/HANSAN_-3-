# HANSAN V3 — Phase 4.2 Security Report

## Controls
- Org/outlet scoped queries (organizationId from DB, not client).
- Membership + role enforcement via resolveAccess on all routes.
- Create/update restricted to owner/admin/manager/developer.
- Unique (org, code) constraint prevents duplicate codes.
- Soft deactivation preserves historical orders.
- Audit logging on create/update.

## Risks
- Auth is demo fallback in dev.
- No RLS (app-layer only).
- No rate limiting.
- Deactivated outlets not yet blocked from receiving orders (POS still uses demo outlet; enforcement is a future integration).
