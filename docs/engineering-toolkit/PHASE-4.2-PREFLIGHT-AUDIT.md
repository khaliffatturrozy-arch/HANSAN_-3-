# HANSAN V3 — Phase 4.2 Preflight Audit

## Existing capabilities
- Schema: organizations, outlets (now with code, address, contactEmail, contactPhone, status, deactivatedAt), memberships, users.
- RBAC: resolveAccess, assertTenantAccess.
- Audit: recordAudit.
- HQ shell + navigation.

## Gaps addressed
- No outlet list/create/edit/deactivate UI existed; now implemented.
- No outlet API existed; now implemented (GET/POST /api/outlets, GET/PATCH /api/outlets/[id]).
- No audit on outlet mutations; now added.

## Authorization rules
- List/detail: org/outlet membership + roles owner/admin/manager/developer/pos/kds/finance/staff.
- Create/update: owner/admin/manager/developer.
- Deactivation via PATCH status=inactive (same auth as update).

## Implementation sequence
1. Schema update (code, address, contact, status, deactivatedAt) — done.
2. Migration (0004) — applied.
3. Seed update (code field) — done.
4. Outlet service (list/get/create/update/deactivate/reactivate) — done.
5. API routes — done.
6. Audit logging — done.
7. HQ UI (list, stats, search, status filter, create/edit/deactivate) — done.
8. Validation — done.
