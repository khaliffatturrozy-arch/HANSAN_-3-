# HANSAN V3 — Order and KDS Contract

## Status definitions

### Overall order status
- `draft` — cart being built, not yet submitted.
- `submitted` — order created (POS checkout succeeded).
- `in_progress` — at least one station ticket is not ready.
- `ready` — all station tickets are ready.
- `completed` — order delivered/picked up (terminal, set by POS or staff).
- `cancelled` — order cancelled (terminal).

### Item status (per order line)
- `pending` — not yet started at its station.
- `preparing` — station started the item.
- `ready` — item ready at its station.

### Kitchen station status (per ticket)
- `new` — ticket received, not started.
- `preparing` — kitchen started.
- `ready` — kitchen finished.

### Bar station status (per ticket)
- `new`, `preparing`, `ready` — same semantics as kitchen, isolated list.

## Completion rule
An order is `ready` only when ALL station tickets (kitchen and bar) for its items are `ready`. Completing a bar ticket does not complete the order; completing a kitchen ticket does not complete the order. Order-level `completed` is set separately (e.g., on pickup/delivery) and is not implied by station readiness.

## Station isolation
- Kitchen and Bar maintain separate ticket lists keyed by station.
- A ticket belongs to exactly one station (kitchen or bar), derived from item.station.
- Actions on one station's tickets must not mutate the other station's tickets.

## Future backend contract
- `POST /api/orders` creates an order + station tickets transactionally.
- `PATCH /api/orders/:id/items/:itemId/status` or station-specific endpoints update item/station status.
- `GET /api/kds/kitchen/tickets`, `GET /api/kds/bar/tickets` return station-filtered tickets.
- Real-time updates via Supabase Realtime or SSE (not required for MVP).
- Idempotency key on order creation (already used in POS).
