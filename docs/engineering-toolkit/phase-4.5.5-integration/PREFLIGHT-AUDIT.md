# HANSAN V3 — Phase 4.5.5 Integration Audit

## Verified integration points
- Catalog → Order: order creation validates catalog items (active, available, effective price) server-side.
- Order → KDS: station tickets created per station (kitchen/bar) from order items.
- KDS isolation: separate ticket lists, independent status transitions, completion of one station does not complete order.
- Order status derivation: deriveOrderStatus aggregates ticket statuses.
- Outlet settings → order: acceptOrders and station active enforced in createOrder.
- Business hours → order: isOutletOpen enforced (timezone-aware, overnight).
- Inventory schema exists (materials, stock, movements, opname) but not wired to orders (deferred).
- Purchasing schema exists (suppliers, POs, receiving) but not wired to inventory receiving (deferred — receiving creates stock movements in service but not fully tested).

## Not verified (no browser/E2E)
- End-to-end order flow via browser.
- Realtime SSE event delivery.
- Mobile responsive rendering.

## Known limitations
- No RLS (app-layer only).
- Auth demo fallback still active.
- No automated DB integration tests.
- Inventory recipe mapping not implemented.
- Automatic stock deduction on order not implemented (deferred).
- Purchasing receiving not fully tested.
