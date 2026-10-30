import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, organizationMemberships, outletMemberships } from "@/db/schema";

export interface ResolvedUser {
  user: { id: string; supabaseUserId: string; email: string; displayName: string | null };
  orgIds: string[];
  outletIds: string[];
  orgRoles: Record<string, string>;
  outletRoles: Record<string, string>;
}

export async function upsertUser(supabaseUserId: string, email: string, displayName?: string | null) {
  const db = getDb();
  const existing = await db.select().from(users).where(eq(users.supabaseUserId, supabaseUserId)).limit(1);
  if (existing.length > 0) {
    return existing[0];
  }
  const inserted = await db.insert(users).values({ supabaseUserId, email, displayName: displayName ?? null }).returning();
  return inserted[0];
}

export async function resolveUserContext(supabaseUserId: string): Promise<ResolvedUser | null> {
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.supabaseUserId, supabaseUserId)).limit(1);
  if (rows.length === 0) return null;
  const u = rows[0];
  const orgMems = await db.select().from(organizationMemberships).where(eq(organizationMemberships.userId, u.id));
  const outletMems = await db.select().from(outletMemberships).where(eq(outletMemberships.userId, u.id));
  const orgIds = orgMems.map((m) => m.organizationId);
  const outletIds = outletMems.map((m) => m.outletId);
  const orgRoles: Record<string, string> = {};
  for (const m of orgMems) orgRoles[m.organizationId] = m.role;
  const outletRoles: Record<string, string> = {};
  for (const m of outletMems) outletRoles[m.outletId] = m.role;
  return {
    user: { id: u.id, supabaseUserId: u.supabaseUserId, email: u.email, displayName: u.displayName },
    orgIds,
    outletIds,
    orgRoles,
    outletRoles,
  };
}

export async function resolveAccess(supabaseUserId: string, orgId?: string, outletId?: string, requiredRoles?: string[]) {
  const ctx = await resolveUserContext(supabaseUserId);
  if (!ctx) throw new Error("USER_NOT_FOUND");
  if (orgId && !ctx.orgIds.includes(orgId)) throw new Error("ORG_ACCESS_DENIED");
  if (outletId && !ctx.outletIds.includes(outletId)) throw new Error("OUTLET_ACCESS_DENIED");
  if (requiredRoles && requiredRoles.length > 0) {
    const roles = [...Object.values(ctx.orgRoles), ...Object.values(ctx.outletRoles)];
    if (!requiredRoles.some((r) => roles.includes(r))) throw new Error("ROLE_ACCESS_DENIED");
  }
  return ctx;
}
