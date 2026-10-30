# HANSAN V3 — Phase 4.4 Preflight Audit

## Reusable
- Outlet schema (extended in 4.2 with code, address, contact, status, deactivatedAt).
- Outlet service, API routes, HQ outlets page.
- Auth/RBAC/audit infrastructure.
- HQ shell + components.

## Gaps addressed
- No settings storage existed; added outlet_settings table.
- No settings API; added GET/PUT /api/outlets/[id]/settings.
- No settings UI; added /hq/outlets/[id]/settings page.
- No order acceptance enforcement; added acceptOrders check + station active check in createOrder.

## Implementation sequence
1. Schema (outlet_settings) + migration 0005 — done.
2. Settings service (get/upsert, validation, defaults) — done.
3. Enforce acceptOrders + station active in createOrder — done.
4. Settings API route — done.
5. HQ settings UI page — done.
6. Settings link on outlets page — done.
7. Validation — done.
