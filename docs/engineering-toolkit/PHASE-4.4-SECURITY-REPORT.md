# HANSAN V3 — Phase 4.4 Security Report

## Controls
- Settings routes enforce auth + RBAC (owner/admin/manager/developer for write; broader read).
- Zod validation on all settings inputs.
- Order acceptance enforced server-side in createOrder (not just UI).
- Station active enforced server-side (inactive station rejects orders).
- Audit logging on settings update.
- Tenant isolation via resolveAccess (org/outlet).

## Risks
- Auth demo fallback still active in dev.
- No RLS (app-layer only).
- No rate limiting.
- Business hours not enforced yet (stored only).
- Timezone not validated as IANA.
