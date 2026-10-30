import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { cancelOrder } from "@/lib/orders";
import { getSupabaseUser } from "@/lib/auth/supabase";
import { getDb } from "@/db";
import { orders, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { resolveAccess } from "@/lib/users";

const schema = z.object({ reason: z.string().min(1).max(500) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON body." } }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
  }
  const db = getDb();
  const orderRows = await db.select().from(orders).where(eq(orders.id, params.id)).limit(1);
  if (orderRows.length === 0) return NextResponse.json({ ok: false, error: { code: "ORDER_NOT_FOUND", message: "Order not found." } }, { status: 404 });
  const order = orderRows[0];

  const authUser = await getSupabaseUser(req);
  let supabaseUserId: string | null = null;
  if (authUser) {
    const { upsertUser } = await import("@/lib/users");
    const profile = await upsertUser(authUser.id, authUser.email ?? "");
    supabaseUserId = profile.supabaseUserId;
  } else if (process.env.NODE_ENV !== "production") {
    const rows = await db.select().from(users).where(eq(users.supabaseUserId, "demo-user-00000000-0000-0000-0000-000000000000")).limit(1);
    supabaseUserId = rows[0]?.supabaseUserId ?? null;
  }
  if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  try {
    await resolveAccess(supabaseUserId, order.organizationId, order.outletId, ["owner", "admin", "manager"]);
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }

  try {
    await cancelOrder(params.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message ?? "CANCEL_FAILED";
    const status = msg === "ORDER_NOT_FOUND" ? 404 : msg === "ORDER_NOT_CANCELLABLE" ? 409 : 400;
    return NextResponse.json({ ok: false, error: { code: msg, message: msg } }, { status });
  }
}
