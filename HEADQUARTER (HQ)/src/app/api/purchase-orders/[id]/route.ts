import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchaseOrders, users } from "@/db/schema";
import { getPurchaseOrder, submitPurchaseOrder, approvePurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder } from "@/lib/purchasing";
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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const po = await getPurchaseOrder(params.id);
  if (!po) return NextResponse.json({ ok: false, error: { code: "PO_NOT_FOUND", message: "Purchase order not found." } }, { status: 404 });
  return NextResponse.json({ ok: true, ...po });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON body." } }, { status: 400 }); }
  const parsed = z.object({ action: z.enum(["submit", "approve", "receive", "cancel"]), notes: z.string().optional() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
  const db = getDb();
  const poRows = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, params.id)).limit(1);
  if (poRows.length === 0) return NextResponse.json({ ok: false, error: { code: "PO_NOT_FOUND", message: "Purchase order not found." } }, { status: 404 });
  const po = poRows[0];
  const supabaseUserId = await resolveRequestUser(req);
  if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  const requiredRoles = parsed.data.action === "approve" ? ["owner", "admin", "manager", "developer"] : ["owner", "admin", "manager", "developer", "staff"];
  try { await resolveAccess(supabaseUserId, po.organizationId, po.outletId, requiredRoles); } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  try {
    if (parsed.data.action === "submit") await submitPurchaseOrder(params.id);
    else if (parsed.data.action === "approve") await approvePurchaseOrder(params.id);
    else if (parsed.data.action === "receive") await receivePurchaseOrder(params.id, null, parsed.data.notes ?? null);
    else if (parsed.data.action === "cancel") await cancelPurchaseOrder(params.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message ?? "ACTION_FAILED";
    return NextResponse.json({ ok: false, error: { code: msg, message: msg } }, { status: 400 });
  }
}
