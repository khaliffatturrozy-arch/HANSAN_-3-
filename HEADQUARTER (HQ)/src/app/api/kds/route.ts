import { NextResponse, type NextRequest } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, orderStationTickets, orderItems, users } from "@/db/schema";
import { getSupabaseUser } from "@/lib/auth/supabase";
import { resolveAccess } from "@/lib/users";

async function resolveRequestUser(req: NextRequest): Promise<string | null> {
  const authUser = await getSupabaseUser(req);
  if (authUser) {
    const { upsertUser } = await import("@/lib/users");
    const profile = await upsertUser(authUser.id, authUser.email ?? "");
    return profile.supabaseUserId;
  }
  if (process.env.NODE_ENV === "production") return null;
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.supabaseUserId, "demo-user-00000000-0000-0000-0000-000000000000")).limit(1);
  return rows[0]?.supabaseUserId ?? null;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const station = url.searchParams.get("station");
  if (station !== "kitchen" && station !== "bar") {
    return NextResponse.json({ ok: false, error: { code: "INVALID_STATION", message: "station must be kitchen or bar" } }, { status: 400 });
  }
  const supabaseUserId = await resolveRequestUser(req);
  if (!supabaseUserId) {
    return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  }
  const requiredRole = station === "kitchen" ? "kds" : "kds";
  // resolve user context for org/outlet scope
  const { resolveUserContext } = await import("@/lib/users");
  const ctx = await resolveUserContext(supabaseUserId);
  if (!ctx) return NextResponse.json({ ok: false, error: { code: "USER_NOT_FOUND", message: "User not found" } }, { status: 403 });

  const db = getDb();
  const tickets = await db.select().from(orderStationTickets).where(eq(orderStationTickets.station, station));
  const enriched = [];
  for (const t of tickets) {
    const orderRows = await db.select().from(orders).where(eq(orders.id, t.orderId)).limit(1);
    const order = orderRows[0];
    if (!order) continue;
    // tenant check: user must have access to the order's org/outlet
    if (!ctx.orgIds.includes(order.organizationId)) continue;
    if (!ctx.outletIds.includes(order.outletId)) continue;
    // role check
    const roles = [...Object.values(ctx.orgRoles), ...Object.values(ctx.outletRoles)];
    if (!roles.includes(requiredRole) && !roles.includes("owner") && !roles.includes("admin") && !roles.includes("manager") && !roles.includes("developer")) continue;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, t.orderId));
    const stationItems = items.filter((i) => i.station === station);
    enriched.push({ ticket: t, order, items: stationItems });
  }
  return NextResponse.json({ ok: true, tickets: enriched });
}
