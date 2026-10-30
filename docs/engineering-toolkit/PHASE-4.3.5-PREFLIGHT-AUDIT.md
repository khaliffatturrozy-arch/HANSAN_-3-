# HANSAN V3 — Phase 4.3.5 Preflight Audit

## Current privilege boundaries
- Role grant matrix implemented in `src/lib/rbac.ts` (`canGrantRole`).
- Matrix: owner grants all; admin grants manager/staff/pos/kds/finance; manager grants staff/pos/kds/finance; others grant nothing.
- Last-owner protection in `removeOrgMembership` and `updateOrgMembershipRole`.
- Audit logging wired to membership create/update/remove (org and outlet).
- Membership authorization enforced in API routes via resolveAccess + canGrantRole.

## Missing controls (before this phase)
- No explicit grant matrix (now added).
- No audit logging on user management mutations (now added).
- No last-owner protection (now added).
- No unit tests for grant matrix (now added, 5 tests).

## Implementation plan
1. Add canGrantRole + isOwnerProtected to rbac.ts.
2. Rewrite userManagement.ts with grant enforcement + audit logging + last-owner protection.
3. Update API routes to pass actorRoles and handle ROLE_GRANT_DENIED / LAST_OWNER_PROTECTED.
4. Add unit tests for grant matrix.
5. Validate.
