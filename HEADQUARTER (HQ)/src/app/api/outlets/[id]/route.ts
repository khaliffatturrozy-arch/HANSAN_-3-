import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { outlets, users } from "@/db/schema";
import { getOutlet, updateOutletSchema, updateOutlet } from "@/lib/outlets";
import { getSupabaseUser } from "@/lib/auth/supabase";
import { resolveAccess } from "@/lib/users";

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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const outlet = await getOutlet(params.id);
  if (!outlet) return NextResponse.json({ ok: false, error: { code: "OUTLET_NOT_FOUND", message: "Outlet not found." } }, { status: 404 });
  const supabaseUserId = await resolveRequestUser(_req);
  if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  try { await resolveAccess(supabaseUserId, outlet.organizationId, outlet.id, ["owner", "admin", "manager", "developer", "pos", "kds", "finance", "staff"]); } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  return NextResponse.json({ ok: true, outlet });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const outlet = await getOutlet(params.id);
  if (!outlet) return NextResponse.json({ ok: false, error: { code: "OUTLET_NOT_FOUND", message: "Outlet not found." } }, { status: 404 });
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON body." } }, { status: 400 });
  }
  const parsed = updateOutletSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
  const supabaseUserId = await resolveRequestUser(req);
  if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  try { await resolveAccess(supabaseUserId, outlet.organizationId, outlet.id, ["owner", "admin", "manager", "developer"]); } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  try {
    const updated = await updateOutlet(params.id, parsed.data);
    try { const { recordAudit } = await import("@/lib/audit"); await recordAudit(getDb(), { actorUserId: null, organizationId: outlet.organizationId, outletId: outlet.id, action: "outlet.update", resourceType: "outlet", resourceId: outlet.id, metadata: parsed.data }); } catch {}
    return NextResponse.json({ ok: true, outlet: updated });
  } catch {
    return NextResponse.json({ ok: false, error: { code: "UPDATE_FAILED", message: "Failed to update outlet." } }, { status: 500 });
  }
}

