# HANSAN V3 — Phase 2.5 Security Report

## Implemented controls
- Server-side auth resolution on all order/KDS routes (Supabase Auth or dev demo fallback).
- Tenant enforcement via `resolveAccess` (org/outlet membership + role).
- Station role enforcement on KDS ticket updates (kds/owner/admin/manager/developer).
- Tenant scoping on KDS GET (filters tickets by user org/outlet membership).
- Deny-by-default on missing user or membership.

## Blocker (unchanged)
- RLS policies NOT implemented: safe per-request session context propagation cannot be guaranteed with shared pg pool. App-layer isolation remains enforcement.

## Risks
- Demo auth still active in dev; production must disable.
- No rate limiting.
- No RLS; app-layer bug could expose cross-tenant data.
- Client-supplied orgSlug/outletSlug resolved server-side against DB; membership enforced.
