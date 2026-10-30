# HANSAN V3 — Phase 4.5.2.1 Security Report

## Controls
- Catalog fetched from authenticated /api/catalog/outlet (auth + RBAC + tenant isolation).
- Server resolves authoritative item price/availability/station during order creation (client price not trusted).
- Invalid items (inactive/unavailable/not found) rejected server-side.
- Cart preserved on rejection (no partial persistence).
- No client-trusted org/outlet IDs (resolved server-side via membership).

## Risks
- Auth demo fallback still active in dev.
- No RLS (app-layer only).
- POS uses demo org/outlet slugs.
- No rate limiting.
