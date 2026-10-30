import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { organizations, outlets, users } from "@/db/schema";
import { createPurchaseOrder, listPurchaseOrders, getPurchaseOrder } from "@/lib/purchasing";
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
  const orgSlug = url.searchParams.get("orgSlug") ?? "demo";
  const outletSlug = url.searchParams.get("outletSlug");
  const db = getDb();
  const orgRows = await db.select().from(organizations).where(eq(organizations.slug, orgSlug)).limit(1);
  if (orgRows.length === 0) return NextResponse.json({ ok: false, error: { code: "ORG_NOT_FOUND", message: "Organization not found." } }, { status: 404 });
  const org = orgRows[0];
  const supabaseUserId = await resolveRequestUser(req);
  if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  try { await resolveAccess(supabaseUserId, org.id, undefined, ["owner", "admin", "manager", "developer", "pos", "kds", "finance", "staff"]); } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  let outletId: string | undefined;
  if (outletSlug) {
    const or = await db.select().from(outlets).where(eq(outlets.slug, outletSlug)).limit(1);
    outletId = or[0]?.id;
  }
  const orders = await listPurchaseOrders(org.id, outletId);
  return NextResponse.json({ ok: true, orders });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON body." } }, { status: 400 }); }
  const schema = z.object({
    organizationId: z.string().uuid(),
    outletId: z.string().uuid(),
    supplierId: z.string().uuid().optional().nullable(),
    idempotencyKey: z.string().min(1),
    expectedDelivery: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    lines: z.array(z.object({ materialId: z.string().uuid(), quantity: z.number().positive(), unit: z.string().min(1), unitCost: z.number().nonnegative() })).min(1),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
  const db = getDb();
  const orgRows = await db.select().from(organizations).where(eq(organizations.id, parsed.data.organizationId)).limit(1);
  if (orgRows.length === 0) return NextResponse.json({ ok: false, error: { code: "ORG_NOT_FOUND", message: "Organization not found." } }, { status: 404 });
  const org = orgRows[0];
  const outletRows = await db.select().from(outlets).where(eq(outlets.id, parsed.data.outletId)).limit(1);
  if (outletRows.length === 0) return NextResponse.json({ ok: false, error: { code: "OUTLET_NOT_FOUND", message: "Outlet not found." } }, { status: 404 });
  const outlet = outletRows[0];
  const supabaseUserId = await resolveRequestUser(req);
  if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  try { await resolveAccess(supabaseUserId, org.id, outlet.id, ["owner", "admin", "manager", "developer"]); } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  try {
    const result = await createPurchaseOrder({ ...parsed.data, createdBy: null });
    return NextResponse.json({ ok: true, ...result }, { status: result.duplicate ? 200 : 201 });
  } catch {
    return NextResponse.json({ ok: false, error: { code: "CREATE_FAILED", message: "Failed to create purchase order." } }, { status: 500 });
  }
}
