# HANSAN V3 — Phase 4.3 Security Report

## Controls
- All routes enforce auth (Supabase or dev demo fallback) + resolveAccess (org/outlet/role).
- Membership create/update/delete restricted to owner/admin/manager/developer.
- Duplicate membership prevention.
- No passwords/tokens exposed (users table stores only supabaseUserId + email + displayName).
- Audit logging: not yet wired to user management mutations (documented gap).

## Risks
- Demo auth still active in dev.
- No RLS (app-layer only).
- Role assignment allows any authorized admin to assign any role (no privilege escalation guard beyond role).
- No invitation flow (Supabase credentials required).
