# HANSAN V3 — Phase 4.5.2 Preflight Audit

## Existing functionality
- Order items already store name/price/qty/subtotal/station snapshots (historical integrity preserved).
- POS uses hardcoded MENU (to be replaced with catalog API).
- No category/menu_item/outlet_menu_config tables existed; added.

## Reusable
- HQ shell, components, RBAC, audit, validation patterns.
- getEffectivePrice, getOutletCatalog service functions.

## Gaps addressed
- No catalog backend: added categories, menu_items, outlet_menu_configs tables + service + API.
- No catalog UI: added /hq/catalog page.
- No outlet catalog endpoint: added GET /api/catalog/outlet.
- No station routing enforcement: station required on menu item create (kitchen/bar).

## Implementation plan
1. Schema (categories, menu_items, outlet_menu_configs) + migration 0006 — done.
2. Catalog service (CRUD, effective price, outlet catalog) — done.
3. API routes (categories, items, outlet) — done.
4. HQ catalog page (create category/item, toggle active) — done.
5. Nav link — done.
6. Validation — done.
