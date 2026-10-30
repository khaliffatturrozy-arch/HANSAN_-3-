# HANSAN V3 — Phase 4.5.2.1 Preflight Audit

## Existing functionality
- POS page used hardcoded MENU array (menu items with id, name, price, station).
- POS cart used CartItem (itemId, name, price, qty, station).
- POS checkout posted to /api/orders with lines (itemId, name, price, qty, station, notes).
- Catalog API exists: GET /api/catalog/outlet?outletId=&orgSlug= returns effective prices + availability.
- Order creation now validates catalog server-side (item exists, active, available, price resolved).

## Changes
- Replaced hardcoded MENU with fetched catalog from /api/catalog/outlet.
- Loading/error/empty states added.
- Cart items use catalog effective price and station (server-resolved on submit).
- POS error handling maps specific error codes to friendly Indonesian messages.
- Cart preserved on submission failure.

## Dependencies
- POS needs outlet resolution (fetches /api/outlets to get outletId).
- POS DB layer synced from HQ (schema, orders, catalog, outletSettings, users, auth).
