import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { updateStationTicket } from "@/lib/orders";

const schema = z.object({ status: z.enum(["new", "preparing", "ready", "cancelled"]) });

export async function PATCH(req: NextRequest, { params }: { params: { ticketId: string } }) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON body." } }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
  }
  const { getDb } = await import("@/db");
  const { orderStationTickets } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const db = getDb();
  const trows = await db.select().from(orderStationTickets).where(eq(orderStationTickets.id, params.ticketId)).limit(1);
  if (trows.length === 0) return NextResponse.json({ ok: false, error: { code: "TICKET_NOT_FOUND", message: "Ticket not found." } }, { status: 404 });
  const { getSupabaseUser } = await import("@/lib/auth/supabase");
  const authUser = await getSupabaseUser(req);
  let supabaseUserId: string | null = null;
  if (authUser) {
    const { upsertUser } = await import("@/lib/users");
    const profile = await upsertUser(authUser.id, authUser.email ?? "");
    supabaseUserId = profile.supabaseUserId;
  } else if (process.env.NODE_ENV !== "production") {
    const { users } = await import("@/db/schema");
    const rows = await db.select().from(users).where(eq(users.supabaseUserId, "demo-user-00000000-0000-0000-0000-000000000000")).limit(1);
    supabaseUserId = rows[0]?.supabaseUserId ?? null;
  }
  if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  const { resolveUserContext } = await import("@/lib/users");
  const ctx = await resolveUserContext(supabaseUserId);
  if (!ctx) return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  const roles = [...Object.values(ctx.orgRoles), ...Object.values(ctx.outletRoles)];
  const allowed = ["kds", "owner", "admin", "manager", "developer"];
  if (!allowed.some((r) => roles.includes(r))) {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Station access denied" } }, { status: 403 });
  }
  try {
    const ticket = await updateStationTicket(params.ticketId, parsed.data.status);
    return NextResponse.json({ ok: true, ticket });
  } catch (e: any) {
    const msg = e?.message ?? "UPDATE_FAILED";
    const status = msg === "TICKET_NOT_FOUND" ? 404 : msg === "INVALID_TRANSITION" ? 409 : 400;
    return NextResponse.json({ ok: false, error: { code: msg, message: msg } }, { status });
  }
}
