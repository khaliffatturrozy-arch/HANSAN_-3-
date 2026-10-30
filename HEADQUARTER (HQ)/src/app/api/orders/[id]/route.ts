import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { getOrder } from "@/lib/orders";
import { getSupabaseUser } from "@/lib/auth/supabase";
import { resolveAccess } from "@/lib/users";

// re-export helper by duplicating minimal resolution
async function resolveRequestUser(req: NextRequest): Promise<string | null> {
  const authUser = await getSupabaseUser(req);
  if (authUser) {
    const { upsertUser } = await import("@/lib/users");
    const profile = await upsertUser(authUser.id, authUser.email ?? "");
    return profile.supabaseUserId;
  }
  if (process.env.NODE_ENV === "production") return null;
  const db = getDb();
  const { users } = await import("@/db/schema");
  const rows = await db.select().from(users).where(eq(users.supabaseUserId, "demo-user-00000000-0000-0000-0000-000000000000")).limit(1);
  return rows[0]?.supabaseUserId ?? null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const order = await getOrder(params.id);
  if (!order) return NextResponse.json({ ok: false, error: { code: "ORDER_NOT_FOUND", message: "Order not found." } }, { status: 404 });
  const supabaseUserId = await resolveRequestUser(req);
  if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  try {
    await resolveAccess(supabaseUserId, order.order.organizationId, order.order.outletId);
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  return NextResponse.json({ ok: true, ...order });
}
