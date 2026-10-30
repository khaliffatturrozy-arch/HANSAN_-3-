import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { outlets, users } from "@/db/schema";
import { createOpnameSession, addOpnameItem, completeOpname } from "@/lib/inventory";
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

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON body." } }, { status: 400 }); }
  const schema = z.object({ action: z.enum(["create", "addItem", "complete"]), outletId: z.string().uuid().optional(), sessionId: z.string().uuid().optional(), materialId: z.string().uuid().optional(), expectedQty: z.number().optional(), actualQty: z.number().optional() });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
  const db = getDb();
  const d = parsed.data;
  if (d.action === "create") {
    if (!d.outletId) return NextResponse.json({ ok: false, error: { code: "MISSING_OUTLET", message: "outletId required" } }, { status: 400 });
    const outletRows = await db.select().from(outlets).where(eq(outlets.id, d.outletId)).limit(1);
    if (outletRows.length === 0) return NextResponse.json({ ok: false, error: { code: "OUTLET_NOT_FOUND", message: "Outlet not found." } }, { status: 404 });
    const outlet = outletRows[0];
    const supabaseUserId = await resolveRequestUser(req);
    if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
    try { await resolveAccess(supabaseUserId, outlet.organizationId, outlet.id, ["owner", "admin", "manager", "developer"]); } catch {
      return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
    }
    const session = await createOpnameSession(d.outletId, outlet.organizationId);
    return NextResponse.json({ ok: true, session }, { status: 201 });
  }
  if (d.action === "addItem") {
    if (!d.sessionId || !d.materialId || d.expectedQty === undefined || d.actualQty === undefined) return NextResponse.json({ ok: false, error: { code: "MISSING_FIELDS", message: "Missing fields" } }, { status: 400 });
    const item = await addOpnameItem(d.sessionId, d.materialId, d.expectedQty, d.actualQty);
    return NextResponse.json({ ok: true, item });
  }
  if (d.action === "complete") {
    if (!d.sessionId) return NextResponse.json({ ok: false, error: { code: "MISSING_SESSION", message: "sessionId required" } }, { status: 400 });
    const session = await completeOpname(d.sessionId);
    return NextResponse.json({ ok: true, session });
  }
  return NextResponse.json({ ok: false, error: { code: "INVALID_ACTION", message: "Invalid action" } }, { status: 400 });
}
