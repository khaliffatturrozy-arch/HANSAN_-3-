# HANSAN V3 — Phase 4.3.5 Security Report

## Controls
- Explicit role grant matrix (deny by default).
- Owner-only owner grant.
- Admin cannot grant owner/admin.
- Manager cannot grant admin/manager.
- Staff/pos/kds/finance/developer cannot grant any role.
- Last-owner protection on removal and demotion.
- Audit logging on all membership mutations (create/update/remove).
- No passwords/tokens logged (redacted).
- Cross-org/cross-outlet membership mutation rejected by resolveAccess.

## Risks
- Audit logging is best-effort (not transactional).
- No RLS (app-layer only).
- No rate limiting.
- Auth demo fallback still active in dev.
