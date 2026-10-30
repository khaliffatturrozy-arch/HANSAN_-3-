# HANSAN V3 — Phase 2 Order API Contract

## POST /api/orders
Body: { orgSlug?, outletSlug?, lines: [{ itemId, name, price, qty, station, notes? }], idempotencyKey, taxPercent? }
Response: { ok, duplicate, order, items, tickets }

## GET /api/orders?orgSlug=&outletSlug=&status=&limit=&offset=
Response: { ok, orders }

## GET /api/orders/:id
Response: { ok, order, items, tickets, history }

## PATCH /api/orders/:id/tickets/:ticketId
Body: { status: new|preparing|ready|cancelled }
Response: { ok, ticket } (409 on invalid transition)

## GET /api/kds?station=kitchen|bar
Response: { ok, tickets: [{ ticket, order, items }] }

## PATCH /api/kds/tickets/:ticketId
Body: { status }
Response: { ok, ticket }

## Error shape
{ ok: false, error: { code, message } }
