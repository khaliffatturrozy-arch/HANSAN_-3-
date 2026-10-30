# HANSAN V3 — Phase 4.4.5 Preflight Audit

## Already correct (do not touch)
- outlet_settings table and migration 0005.
- getSettings/upsertSettings with defaults.
- isStationActive.
- acceptOrders check in createOrder.
- station active check in createOrder.
- Settings API route (auth, RBAC, Zod, audit).
- HQ settings UI.

## Gaps found
1. Timezone not validated as IANA (stored as free string) — FIXED (isValidTimezone via Intl.DateTimeFormat).
2. Business hours stored but never enforced — FIXED (isOutletOpen + enforcement in createOrder).
3. No overnight schedule handling — FIXED (prev-day overnight check).
4. No automated DB integration tests — added unit tests for isOutletOpen/isValidTimezone (8 tests).
5. No clock injection — FIXED (optional `now` param on isOutletOpen and createOrder).

## Implementation
- Rewrote outletSettings.ts cleanly (removed duplicates).
- Added isOutletOpen with timezone-aware, overnight, boundary handling.
- Added isValidTimezone.
- Updated settingsSchema with IANA validation + businessHours day schema.
- Updated createOrder to enforce business hours (OUTLET_CLOSED) and acceptOrders and station active.
- Added OUTLET_CLOSED to API error mapping.
- Added tests/settings.test.ts (8 tests).

## Validation
- HQ: lint PASS, typecheck PASS, tests 28/28 PASS.
