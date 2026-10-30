# HANSAN V3 — Phase 4.5.1 Preflight Audit

## Current dashboard implementation
- `/hq` page previously showed placeholder EmptyState cards (Orders today, Revenue, Inventory alerts) with "No data".
- No real data displayed.

## Available data sources
- orders, order_items, order_station_tickets, outlets, outlet_settings tables.
- Dashboard service: `src/lib/dashboard.ts` (getBusinessOverview, getLiveOps, getOutletPerformance, getStationWorkload, getOrderVolume, getOperationalAlerts).
- API: `GET /api/dashboard` (auth, RBAC, tenant isolation, date range).

## Missing data
- Revenue/payment data (no payment model) → shown as "Not supported yet".
- Order channel (not stored) → omitted.
- Chart library (none) → CSS bar chart used.

## Existing access permissions
- Owner/admin/manager/developer: organization-level overview.
- resolveAccess enforces org/outlet membership.

## Existing realtime capabilities
- SSE outbox (Phase 3). Dashboard uses manual refresh (Apply button). SSE subscription not wired (documented limitation).

## Reusable components
- PageHeader, Card, CardTitle, CardDescription, EmptyState, Badge, Button.

## Implementation plan
1. Create dashboard service with typed aggregation functions.
2. Create GET /api/dashboard endpoint.
3. Rewrite /hq page to consume real data.
4. CSS bar chart (no new dependency).
5. Loading/empty/error/unavailable states.
6. Validate + docs.
