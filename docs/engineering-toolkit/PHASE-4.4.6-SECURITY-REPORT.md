# HANSAN V3 — Phase 4.4.6 Security Report

## Controls
- Business-hours enforcement server-side in createOrder (timezone-aware, overnight, boundary).
- acceptOrders and station active enforced server-side.
- Tenant isolation via resolveAccess (app-layer).
- POS does not determine outlet open/closed; server is authority.
- Error responses use consistent shape { ok, error: { code, message } }.

## Risks
- Auth demo fallback still active in dev.
- No RLS (app-layer only).
- No rate limiting.
- No visual browser/screenshot tooling.
