import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { organizations, outlets, users } from "@/db/schema";
import { createOrder } from "@/lib/orders";
import { getSupabaseUser } from "@/lib/auth/supabase";
import { resolveAccess, upsertUser } from "@/lib/users";

const lineSchema = z.object({
  itemId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  qty: z.number().int().positive(),
  station: z.enum(["kitchen", "bar"]),
  notes: z.string().nullable().optional(),
});

const createSchema = z.object({
  orgSlug: z.string().default("demo"),
  outletSlug: z.string().default("main"),
  lines: z.array(lineSchema).min(1),
  idempotencyKey: z.string().min(1),
  taxPercent: z.number().min(0).max(100).optional(),
});

async function resolveDemoUser() {
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.supabaseUserId, "demo-user-00000000-0000-0000-0000-000000000000")).limit(1);
  return rows[0] ?? null;
}

async function resolveRequestUser(req: NextRequest): Promise<string | null> {
  const authUser = await getSupabaseUser(req);
  if (authUser) {
    const profile = await upsertUser(authUser.id, authUser.email ?? "");
    return profile.supabaseUserId;
  }
  if (process.env.NODE_ENV === "production") return null;
  const demo = await resolveDemoUser();
  return demo?.supabaseUserId ?? null;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON body." } }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
  }
  const db = getDb();
  const orgRows = await db.select().from(organizations).where(eq(organizations.slug, parsed.data.orgSlug)).limit(1);
  if (orgRows.length === 0) return NextResponse.json({ ok: false, error: { code: "ORG_NOT_FOUND", message: "Organization not found." } }, { status: 404 });
  const org = orgRows[0];
  const outletRows = await db.select().from(outlets).where(eq(outlets.slug, parsed.data.outletSlug)).limit(1);
  if (outletRows.length === 0) return NextResponse.json({ ok: false, error: { code: "OUTLET_NOT_FOUND", message: "Outlet not found." } }, { status: 404 });
  const outlet = outletRows[0];

  const supabaseUserId = await resolveRequestUser(req);
  if (!supabaseUserId) {
    return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  }
  try {
    await resolveAccess(supabaseUserId, org.id, outlet.id, ["owner", "admin", "manager", "pos", "developer"]);
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }

  const userRows = await db.select().from(users).where(eq(users.supabaseUserId, supabaseUserId)).limit(1);
  const createdBy = userRows[0]?.id ?? null;

  // server-side catalog validation + price resolution
  const { getOutletCatalog } = await import("@/lib/catalog");
  const catalog = await getOutletCatalog(outlet.id, org.id);
  const catalogMap = new Map(catalog.map((c: any) => [c.item.id, c]));
  const resolvedLines = [];
  for (const l of parsed.data.lines) {
    const entry = catalogMap.get(l.itemId);
    if (!entry) return NextResponse.json({ ok: false, error: { code: "ITEM_NOT_FOUND", message: "Item not found in outlet catalog." } }, { status: 400 });
    if (entry.item.active !== "true") return NextResponse.json({ ok: false, error: { code: "ITEM_INACTIVE", message: "Item is inactive." } }, { status: 400 });
    if (!entry.available) return NextResponse.json({ ok: false, error: { code: "ITEM_UNAVAILABLE", message: "Item is unavailable." } }, { status: 400 });
    resolvedLines.push({ ...l, name: entry.item.name, price: entry.effectivePrice, station: entry.item.station });
  }

  try {
    const result = await createOrder({
      organizationId: org.id,
      outletId: outlet.id,
      idempotencyKey: parsed.data.idempotencyKey,
      createdBy,
      taxPercent: parsed.data.taxPercent,
      lines: resolvedLines,
    });
    return NextResponse.json({ ok: true, duplicate: result.duplicate, order: result.order, items: result.items, tickets: result.tickets }, { status: result.duplicate ? 200 : 201 });
  } catch (e: any) {
    const msg = e?.message ?? "ORDER_CREATE_FAILED";
    if (msg === "OUTLET_NOT_ACCEPTING_ORDERS") return NextResponse.json({ ok: false, error: { code: msg, message: "Outlet is not accepting orders." } }, { status: 409 });
    if (msg === "STATION_INACTIVE") return NextResponse.json({ ok: false, error: { code: msg, message: "A required station is inactive." } }, { status: 409 });
    if (msg === "OUTLET_CLOSED") return NextResponse.json({ ok: false, error: { code: msg, message: "Outlet is currently closed." } }, { status: 409 });
    return NextResponse.json({ ok: false, error: { code: "ORDER_CREATE_FAILED", message: "Failed to create order." } }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const orgSlug = url.searchParams.get("orgSlug") ?? "demo";
  const outletSlug = url.searchParams.get("outletSlug");
  const status = url.searchParams.get("status") ?? undefined;
  const search = url.searchParams.get("search") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const limit = Number(url.searchParams.get("limit") ?? 20);
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const db = getDb();
  const orgRows = await db.select().from(organizations).where(eq(organizations.slug, orgSlug)).limit(1);
  if (orgRows.length === 0) return NextResponse.json({ ok: false, error: { code: "ORG_NOT_FOUND", message: "Organization not found." } }, { status: 404 });
  const org = orgRows[0];

  const supabaseUserId = await resolveRequestUser(req);
  if (!supabaseUserId) {
    return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  }
  try {
    await resolveAccess(supabaseUserId, org.id, undefined, ["owner", "admin", "manager", "pos", "developer", "staff", "kds", "finance"]);
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }

  let outletId: string | undefined;
  if (outletSlug) {
    const or = await db.select().from(outlets).where(eq(outlets.slug, outletSlug)).limit(1);
    outletId = or[0]?.id;
    if (outletId) {
      try { await resolveAccess(supabaseUserId, org.id, outletId); } catch {
        return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
      }
    }
  }
  const { listOrders } = await import("@/lib/orders");
  const result = await listOrders({ organizationId: org.id, outletId, status, search, from, to, limit, offset });
  return NextResponse.json({ ok: true, orders: result.items, total: result.total });
}




