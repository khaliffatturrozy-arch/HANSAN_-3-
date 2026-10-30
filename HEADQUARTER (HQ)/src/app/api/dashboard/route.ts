import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { organizations, outlets, users } from "@/db/schema";
import { getSupabaseUser } from "@/lib/auth/supabase";
import { resolveAccess } from "@/lib/users";
import { getBusinessOverview, getLiveOps, getOutletPerformance, getStationWorkload, getOrderVolume, getOperationalAlerts } from "@/lib/dashboard";

async function resolveRequestUser(req: NextRequest) {
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
  const orgSlug = url.searchParams.get("orgSlug") ?? "demo";
  const outletSlug = url.searchParams.get("outletSlug");
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const db = getDb();
  const orgRows = await db.select().from(organizations).where(eq(organizations.slug, orgSlug)).limit(1);
  if (orgRows.length === 0) return NextResponse.json({ ok: false, error: { code: "ORG_NOT_FOUND", message: "Organization not found." } }, { status: 404 });
  const org = orgRows[0];
  const supabaseUserId = await resolveRequestUser(req);
  if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  try { await resolveAccess(supabaseUserId, org.id, undefined, ["owner", "admin", "manager", "developer"]);
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  // authorized outlets
  const allOutlets = await db.select().from(outlets).where(eq(outlets.organizationId, org.id));
  let authorizedOutletIds = allOutlets.map((o) => o.id);
  // filter by user membership
  const { resolveUserContext } = await import("@/lib/users");
  const ctx = await resolveUserContext(supabaseUserId);
  if (ctx) authorizedOutletIds = authorizedOutletIds.filter((id) => ctx.outletIds.includes(id));
  if (authorizedOutletIds.length === 0) authorizedOutletIds = allOutlets.map((o) => o.id); // fallback for demo
  if (outletSlug) {
    const or = allOutlets.find((o) => o.slug === outletSlug);
    if (or && authorizedOutletIds.includes(or.id)) authorizedOutletIds = [or.id];
  }
  const now = new Date();
  const from = fromStr ? new Date(fromStr) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const to = toStr ? new Date(toStr) : now;
  const filters = { organizationId: org.id, outletIds: authorizedOutletIds, from, to };
  const [overview, liveOps, outletPerf, stations, volume, alerts] = await Promise.all([
    getBusinessOverview(filters),
    getLiveOps(filters),
    getOutletPerformance(filters),
    getStationWorkload(filters),
    getOrderVolume(filters),
    getOperationalAlerts(filters),
  ]);
  return NextResponse.json({ ok: true, overview, liveOps, outletPerformance: outletPerf, stations, volume, alerts });
}
