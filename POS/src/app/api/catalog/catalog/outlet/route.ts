import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { organizations, outlets, users } from "@/db/schema";
import { getOutletCatalog } from "@/lib/catalog";
import { getSupabaseUser } from "@/lib/auth/supabase";
import { resolveAccess } from "@/lib/users";

async function resolveRequestUser(req: NextRequest) {
  const authUser = await getSupabaseUser(req);
  if (authUser) { const { upsertUser } = await import("@/lib/users"); const p = await upsertUser(authUser.id, authUser.email ?? ""); return p.supabaseUserId; }
  if (process.env.NODE_ENV === "production") return null;
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.supabaseUserId, "demo-user-00000000-0000-0000-0000-000000000000")).limit(1);
  return rows[0]?.supabaseUserId ?? null;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const outletId = url.searchParams.get("outletId");
  const orgSlug = url.searchParams.get("orgSlug") ?? "demo";
  if (!outletId) return NextResponse.json({ ok: false, error: { code: "MISSING_OUTLET", message: "outletId required" } }, { status: 400 });
  const db = getDb();
  const outletRows = await db.select().from(outlets).where(eq(outlets.id, outletId)).limit(1);
  if (outletRows.length === 0) return NextResponse.json({ ok: false, error: { code: "OUTLET_NOT_FOUND", message: "Outlet not found." } }, { status: 404 });
  const outlet = outletRows[0];
  const orgRows = await db.select().from(organizations).where(eq(organizations.slug, orgSlug)).limit(1);
  const org = orgRows[0];
  if (!org || org.id !== outlet.organizationId) return NextResponse.json({ ok: false, error: { code: "ORG_MISMATCH", message: "Outlet does not belong to organization." } }, { status: 403 });
  const supabaseUserId = await resolveRequestUser(req);
  if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  try { await resolveAccess(supabaseUserId, org.id, outlet.id); } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  const catalog = await getOutletCatalog(outletId, org.id);
  return NextResponse.json({ ok: true, catalog });
}
