# HANSAN V3 — Phase 4.5.2.3 Preflight Audit

## Current state verified
- Catalog schema: categories, menu_items, outlet_menu_configs (migration 0006).
- Catalog service: src/lib/catalog.ts (CRUD, effective price, outlet catalog, upsertOutletConfig).
- API: categories (GET/POST/PATCH), items (GET/POST/PATCH), outlet (GET), outlet-config (GET/POST).
- HQ UI: /hq/catalog, /hq/catalog/outlets.
- POS: fetches catalog from /api/catalog/outlet; server resolves price/availability/station.
- Order creation validates catalog server-side.
- Historical order snapshots: order_items stores name/price/qty/station.

## Gaps addressed
1. Price editing used prompt() — replaced with inline number input + Set price button.
2. RLS assessment documented (not implemented — app-layer only).
3. Tenant isolation verified by code review (resolveAccess on all routes).

## RLS readiness assessment
- No RLS policies exist. Authorization is app-layer only (resolveAccess checks org/outlet membership).
- Safe RLS context propagation cannot be guaranteed with shared pg pool (documented blocker from Phase 1.5).
- Recommendation: implement RLS when per-request transaction scoping is available (e.g., Drizzle transaction per request with set_config). Not in this phase.
