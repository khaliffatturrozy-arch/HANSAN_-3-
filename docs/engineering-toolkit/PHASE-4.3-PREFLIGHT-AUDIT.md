# HANSAN V3 — Phase 4.3 Preflight Audit

## Existing authorization architecture
- Supabase Auth identity (server-side verification utility).
- Internal users table (supabaseUserId, email, displayName).
- organization_memberships, outlet_memberships (userId, org/outlet, role).
- roles, permissions, role_permissions tables (seeded minimally).
- resolveUserContext, resolveAccess (RBAC).
- Audit: recordAudit.

## Gaps addressed
- No user directory existed; now implemented (/hq/users).
- No membership management UI/API; now implemented.
- No role assignment UI; now implemented (role select per membership).
- No user listing API; now implemented (GET /api/users).

## Authorization rules
- List/detail: owner/admin/manager/developer.
- Membership create/update/delete: owner/admin/manager/developer.
- Role assignment via membership role update; no privilege escalation guard beyond role-based access (documented limitation).

## Implementation sequence
1. User management service (list/get/add/remove/update memberships) — done.
2. API routes (users, memberships) — done.
3. HQ users page (directory, detail, membership management) — done.
4. Nav link — done.
5. Validation — done.
