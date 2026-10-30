# HANSAN V3 — Phase 4.5.2.2 Preflight Audit

## Existing capabilities
- outlet_menu_configs table (outletId, menuItemId, priceOverride, available, active).
- getOutletCatalog, upsertOutletConfig, listOutletConfigs in catalog service.
- Effective price resolution: override → base price.
- POS integration uses effective price from catalog.

## Gaps addressed
- No outlet config API: added GET/POST /api/catalog/outlet-config.
- No HQ UI for outlet config: added /hq/catalog/outlets page (outlet selector, price override, active/available toggles).
- Nav link added.

## Authorization
- Read: auth + RBAC (owner/admin/manager/developer/pos/kds/finance/staff).
- Write: owner/admin/manager/developer.

## Implementation sequence
1. API route — done.
2. HQ UI page — done.
3. Nav link — done.
4. Validation — done.
