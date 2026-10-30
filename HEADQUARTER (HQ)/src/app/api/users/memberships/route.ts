import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { organizations, outlets, users } from "@/db/schema";
import { addOrgMembershipSchema, addOutletMembershipSchema, addOrgMembership, addOutletMembership } from "@/lib/userManagement";
import { getSupabaseUser } from "@/lib/auth/supabase";
import { resolveAccess } from "@/lib/users";

const bodySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("org"), userId: z.string().uuid(), organizationId: z.string().uuid(), role: z.string().min(1) }),
  z.object({ type: z.literal("outlet"), userId: z.string().uuid(), outletId: z.string().uuid(), role: z.string().min(1) }),
]);

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

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON body." } }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
  const db = getDb();
  const supabaseUserId = await resolveRequestUser(req);
  if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });

  if (parsed.data.type === "org") {
    const orgRows = await db.select().from(organizations).where(eq(organizations.id, parsed.data.organizationId)).limit(1);
    if (orgRows.length === 0) return NextResponse.json({ ok: false, error: { code: "ORG_NOT_FOUND", message: "Organization not found." } }, { status: 404 });
    let ctx: any;
    try { ctx = await (await import("@/lib/users")).resolveUserContext(supabaseUserId); await resolveAccess(supabaseUserId, parsed.data.organizationId, undefined, ["owner", "admin", "manager", "developer"]); } catch {
      return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
    }
    const actorRoles = ctx ? ([...Object.values(ctx.orgRoles), ...Object.values(ctx.outletRoles)] as string[]) : [];
    try {
      const mem = await addOrgMembership(parsed.data, ctx?.user?.id ?? null, actorRoles);
      return NextResponse.json({ ok: true, membership: mem }, { status: 201 });
    } catch (e: any) {
      if (String(e?.message ?? "").includes("DUPLICATE")) return NextResponse.json({ ok: false, error: { code: "DUPLICATE_MEMBERSHIP", message: "Membership already exists." } }, { status: 409 });
      if (String(e?.message ?? "").includes("ROLE_GRANT_DENIED")) return NextResponse.json({ ok: false, error: { code: "ROLE_GRANT_DENIED", message: "You cannot grant this role." } }, { status: 403 });
      return NextResponse.json({ ok: false, error: { code: "CREATE_FAILED", message: "Failed to create membership." } }, { status: 500 });
    }
  } else {
    const outletRows = await db.select().from(outlets).where(eq(outlets.id, parsed.data.outletId)).limit(1);
    if (outletRows.length === 0) return NextResponse.json({ ok: false, error: { code: "OUTLET_NOT_FOUND", message: "Outlet not found." } }, { status: 404 });
    const outlet = outletRows[0];
    let ctx2: any;
    try { ctx2 = await (await import("@/lib/users")).resolveUserContext(supabaseUserId); await resolveAccess(supabaseUserId, outlet.organizationId, parsed.data.outletId, ["owner", "admin", "manager", "developer"]); } catch {
      return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
    }
    const actorRoles2 = ctx2 ? ([...Object.values(ctx2.orgRoles), ...Object.values(ctx2.outletRoles)] as string[]) : [];
    try {
      const mem = await addOutletMembership(parsed.data, ctx2?.user?.id ?? null, actorRoles2);
      return NextResponse.json({ ok: true, membership: mem }, { status: 201 });
    } catch (e: any) {
      if (String(e?.message ?? "").includes("DUPLICATE")) return NextResponse.json({ ok: false, error: { code: "DUPLICATE_MEMBERSHIP", message: "Membership already exists." } }, { status: 409 });
      if (String(e?.message ?? "").includes("ROLE_GRANT_DENIED")) return NextResponse.json({ ok: false, error: { code: "ROLE_GRANT_DENIED", message: "You cannot grant this role." } }, { status: 403 });
      return NextResponse.json({ ok: false, error: { code: "CREATE_FAILED", message: "Failed to create membership." } }, { status: 500 });
    }
  }
}



