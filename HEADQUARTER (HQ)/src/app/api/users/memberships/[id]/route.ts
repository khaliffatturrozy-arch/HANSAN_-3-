import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { organizationMemberships, outletMemberships, users, outlets } from "@/db/schema";
import { updateOutletMembershipRole, removeOrgMembership, removeOutletMembership } from "@/lib/userManagement";
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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const type = new URL(req.url).searchParams.get("type") ?? "outlet";
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON body." } }, { status: 400 });
  }
  const parsed = z.object({ role: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
  const supabaseUserId = await resolveRequestUser(req);
  if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  const db = getDb();
  if (type === "org") {
    const mems = await db.select().from(organizationMemberships).where(eq(organizationMemberships.id, params.id)).limit(1);
    if (mems.length === 0) return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "Membership not found." } }, { status: 404 });
    const mem = mems[0];
    try { await resolveAccess(supabaseUserId, mem.organizationId, undefined, ["owner", "admin", "manager", "developer"]); } catch {
      return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
    }
    // org membership role update not in service; do inline
    const { resolveUserContext } = await import("@/lib/users");
    const ctx = await resolveUserContext(supabaseUserId);
    const actorRoles = ctx ? ([...Object.values(ctx.orgRoles), ...Object.values(ctx.outletRoles)] as string[]) : [];
    let row;
    try { row = await (await import("@/lib/userManagement")).updateOrgMembershipRole(params.id, parsed.data.role, ctx?.user?.id ?? null, actorRoles); } catch (e: any) {
      if (String(e?.message ?? "").includes("ROLE_GRANT_DENIED")) return NextResponse.json({ ok: false, error: { code: "ROLE_GRANT_DENIED", message: "You cannot grant this role." } }, { status: 403 });
      if (String(e?.message ?? "").includes("LAST_OWNER_PROTECTED")) return NextResponse.json({ ok: false, error: { code: "LAST_OWNER_PROTECTED", message: "Cannot remove the last owner." } }, { status: 409 });
      throw e;
    }
    return NextResponse.json({ ok: true, membership: row });
  } else {
    const mems = await db.select().from(outletMemberships).where(eq(outletMemberships.id, params.id)).limit(1);
    if (mems.length === 0) return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "Membership not found." } }, { status: 404 });
    const mem = mems[0];
    const outletRows = await db.select().from(outlets).where(eq(outlets.id, mem.outletId)).limit(1);
    const outlet = outletRows[0];
    try { await resolveAccess(supabaseUserId, outlet.organizationId, outlet.id, ["owner", "admin", "manager", "developer"]); } catch {
      return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
    }
    const { resolveUserContext } = await import("@/lib/users");
    const ctx = await resolveUserContext(supabaseUserId);
    const actorRoles = ctx ? ([...Object.values(ctx.orgRoles), ...Object.values(ctx.outletRoles)] as string[]) : [];
    let row;
    try { row = await updateOutletMembershipRole(params.id, parsed.data.role, ctx?.user?.id ?? null, actorRoles); } catch (e: any) {
      if (String(e?.message ?? "").includes("ROLE_GRANT_DENIED")) return NextResponse.json({ ok: false, error: { code: "ROLE_GRANT_DENIED", message: "You cannot grant this role." } }, { status: 403 });
      throw e;
    }
    return NextResponse.json({ ok: true, membership: row });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const type = new URL(req.url).searchParams.get("type") ?? "outlet";
  const db = getDb();
  if (type === "org") {
    const mems = await db.select().from(organizationMemberships).where(eq(organizationMemberships.id, params.id)).limit(1);
    if (mems.length === 0) return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "Membership not found." } }, { status: 404 });
    const mem = mems[0];
    // resolve auth
    const supabaseUserId = await (async () => {
      const authUser = await getSupabaseUser(req);
      if (authUser) { const { upsertUser } = await import("@/lib/users"); const p = await upsertUser(authUser.id, authUser.email ?? ""); return p.supabaseUserId; }
      if (process.env.NODE_ENV === "production") return null;
      const rows = await db.select().from(users).where(eq(users.supabaseUserId, "demo-user-00000000-0000-0000-0000-000000000000")).limit(1);
      return rows[0]?.supabaseUserId ?? null;
    })();
    if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
    try { await resolveAccess(supabaseUserId, mem.organizationId, undefined, ["owner", "admin", "manager", "developer"]); } catch {
      return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
    }
    const { resolveUserContext } = await import("@/lib/users");
    const ctx = await resolveUserContext(supabaseUserId);
    const actorRoles = ctx ? ([...Object.values(ctx.orgRoles), ...Object.values(ctx.outletRoles)] as string[]) : [];
    try { await removeOrgMembership(params.id, ctx?.user?.id ?? null, actorRoles); } catch (e: any) {
      if (String(e?.message ?? "").includes("LAST_OWNER_PROTECTED")) return NextResponse.json({ ok: false, error: { code: "LAST_OWNER_PROTECTED", message: "Cannot remove the last owner." } }, { status: 409 });
      throw e;
    }
    return NextResponse.json({ ok: true });
  } else {
    const mems = await db.select().from(outletMemberships).where(eq(outletMemberships.id, params.id)).limit(1);
    if (mems.length === 0) return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "Membership not found." } }, { status: 404 });
    const mem = mems[0];
    const outletRows = await db.select().from(outlets).where(eq(outlets.id, mem.outletId)).limit(1);
    const outlet = outletRows[0];
    const supabaseUserId = await (async () => {
      const authUser = await getSupabaseUser(req);
      if (authUser) { const { upsertUser } = await import("@/lib/users"); const p = await upsertUser(authUser.id, authUser.email ?? ""); return p.supabaseUserId; }
      if (process.env.NODE_ENV === "production") return null;
      const rows = await db.select().from(users).where(eq(users.supabaseUserId, "demo-user-00000000-0000-0000-0000-000000000000")).limit(1);
      return rows[0]?.supabaseUserId ?? null;
    })();
    if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
    try { await resolveAccess(supabaseUserId, outlet.organizationId, outlet.id, ["owner", "admin", "manager", "developer"]); } catch {
      return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
    }
    const { resolveUserContext } = await import("@/lib/users");
    const ctx = await resolveUserContext(supabaseUserId);
    const actorRoles = ctx ? ([...Object.values(ctx.orgRoles), ...Object.values(ctx.outletRoles)] as string[]) : [];
    await removeOutletMembership(params.id, ctx?.user?.id ?? null, actorRoles);
    return NextResponse.json({ ok: true });
  }
}



