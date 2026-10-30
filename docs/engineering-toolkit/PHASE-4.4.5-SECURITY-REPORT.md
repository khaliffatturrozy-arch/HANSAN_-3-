# HANSAN V3 — Phase 4.4.5 Security Report

## Controls
- Timezone validated server-side via Intl.DateTimeFormat (rejects invalid IANA).
- Business hours enforced server-side in createOrder (not just UI).
- acceptOrders enforced server-side.
- Station active enforced server-side.
- Tenant isolation via resolveAccess (app-layer).
- Audit logging on settings update.

## Risks
- Auth demo fallback still active in dev.
- No RLS (app-layer only).
- Business hours stored but validation at storage time is structural only (time ranges not cross-validated).
- Timezone of existing stored data not re-validated.
