# HANSAN V3 — Phase 4.1 Preflight Audit

## Reusable functionality
- Shell: HQShell (sidebar, header, mobile drawer).
- UI components: Button, Input, Alert, Card, PageHeader, EmptyState, Badge.
- Order service: createOrder, getOrder, listOrders (search/status/outlet/date/pagination), cancelOrder, updateStationTicket, deriveOrderStatus.
- API routes: /api/orders, /api/orders/[id], /api/orders/cancel/[id], /api/kds, /api/events (SSE).
- Auth/RBAC: getSupabaseUser, resolveAccess, upsertUser, resolveUserContext.
- Audit: recordAudit, redactSensitive.

## Incomplete functionality
- Order filters were server-side but the UI only had basic status; now extended.
- No order detail view existed; now implemented (modal).
- No cancellation UI existed; now implemented with confirmation + reason.
- No SSE refresh on orders page; now added.

## Missing APIs
- None new required; reused existing endpoints.

## Authorization requirements
- Order list/detail: org/outlet membership + roles owner/admin/manager/pos/developer/staff/kds/finance.
- Cancel: owner/admin/manager only.

## UI/UX gaps addressed
- Stats cards, search, filters, date range, pagination, detail modal, station progress, status history, cancellation.
- Loading/empty/error states implemented.
- Responsive: grid-cols-2/4, flex-wrap, modal max-w-2xl.

## Test gaps
- Backend order tests: deriveOrderStatus unit tests only. Integration tests not yet automated (DB seed required).

## Implementation sequence
1. Enhance listOrders (search/status/outlet/date/pagination) — done.
2. Add cancel endpoint — done.
3. Rewrite HQ orders page with full UI — done.
4. Validate — done (lint/typecheck/tests PASS).
