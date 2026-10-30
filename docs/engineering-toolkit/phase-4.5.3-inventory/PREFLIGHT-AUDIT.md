# HANSAN V3 — Phase 4.5.3 Preflight Audit

## Existing capabilities reused
- Outlet, organization, user, RBAC, audit infrastructure.
- HQ shell, components, design tokens.

## Implemented
- Inventory schema: inventory_materials, inventory_stock, inventory_movements, stock_opname_sessions, stock_opname_items (migration 0007).
- Inventory service: src/lib/inventory.ts (list/create materials, get/list stock, adjustStock with movement ledger, listMovements, opname session/item/complete).
- API: /api/inventory/materials (GET/POST), /api/inventory/stock (GET/POST adjust), /api/inventory/movements (GET), /api/inventory/opname (POST).
- HQ UI: /hq/inventory (create material, list materials).
- Nav link added.

## Not implemented (scope limits)
- Recipe/ingredient mapping (menu item → material) — not yet.
- Stock opname UI (API exists, no UI).
- Unit conversion logic.
- Automatic stock deduction on order (deferred — requires lifecycle audit).
- Inventory dashboard with low-stock alerts (basic list only).

## Validation
- HQ: lint PASS, typecheck PASS, tests 15/15 PASS.
