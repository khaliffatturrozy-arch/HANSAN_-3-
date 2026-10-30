import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { outlets, users } from "@/db/schema";
import { listStock, adjustStock } from "@/lib/inventory";
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
  const outletId = new URL(req.url).searchParams.get("outletId");
  if (!outletId) return NextResponse.json({ ok: false, error: { code: "MISSING_OUTLET", message: "outletId required" } }, { status: 400 });
  const db = getDb();
  const outletRows = await db.select().from(outlets).where(eq(outlets.id, outletId)).limit(1);
  if (outletRows.length === 0) return NextResponse.json({ ok: false, error: { code: "OUTLET_NOT_FOUND", message: "Outlet not found." } }, { status: 404 });
  const outlet = outletRows[0];
  const supabaseUserId = await resolveRequestUser(req);
  if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  try { await resolveAccess(supabaseUserId, outlet.organizationId, outlet.id); } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  const stock = await listStock(outletId);
  return NextResponse.json({ ok: true, stock });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON body." } }, { status: 400 }); }
  const schema = z.object({ outletId: z.string().uuid(), materialId: z.string().uuid(), quantity: z.number(), type: z.string().min(1), reason: z.string().optional().nullable() });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
  const db = getDb();
  const outletRows = await db.select().from(outlets).where(eq(outlets.id, parsed.data.outletId)).limit(1);
  if (outletRows.length === 0) return NextResponse.json({ ok: false, error: { code: "OUTLET_NOT_FOUND", message: "Outlet not found." } }, { status: 404 });
  const outlet = outletRows[0];
  const supabaseUserId = await resolveRequestUser(req);
  if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  try { await resolveAccess(supabaseUserId, outlet.organizationId, outlet.id, ["owner", "admin", "manager", "developer"]); } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  try {
    const result = await adjustStock({ outletId: parsed.data.outletId, materialId: parsed.data.materialId, quantity: parsed.data.quantity, type: parsed.data.type, reason: parsed.data.reason ?? null });
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ ok: false, error: { code: "ADJUST_FAILED", message: "Failed to adjust stock." } }, { status: 500 });
  }
}
