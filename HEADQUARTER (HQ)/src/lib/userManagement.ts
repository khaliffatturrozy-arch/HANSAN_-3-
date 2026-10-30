import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { users, organizations, outlets, organizationMemberships, outletMemberships } from "@/db/schema";
import { z } from "zod";
import { canGrantRole } from "@/lib/rbac";
import { recordAudit } from "@/lib/audit";

export const addOrgMembershipSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  role: z.string().min(1),
});

export const addOutletMembershipSchema = z.object({
  userId: z.string().uuid(),
  outletId: z.string().uuid(),
  role: z.string().min(1),
});

export async function listUsers(organizationId: string) {
  const db = getDb();
  const memberships = await db.select().from(organizationMemberships).where(eq(organizationMemberships.organizationId, organizationId));
  const userIds = memberships.map((m) => m.userId);
  if (userIds.length === 0) return [];
  const allUsers = await db.select().from(users);
  const filtered = allUsers.filter((u) => userIds.includes(u.id));
  return filtered.map((u) => {
    const mem = memberships.find((m) => m.userId === u.id)!;
    return { ...u, orgRole: mem.role, orgMembershipId: mem.id };
  });
}

export async function getUserDetail(userId: string) {
  const db = getDb();
  const uRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (uRows.length === 0) return null;
  const u = uRows[0];
  const orgMems = await db.select().from(organizationMemberships).where(eq(organizationMemberships.userId, u.id));
  const outletMems = await db.select().from(outletMemberships).where(eq(outletMemberships.userId, u.id));
  return { user: u, orgMemberships: orgMems, outletMemberships: outletMems };
}

export async function addOrgMembership(input: z.infer<typeof addOrgMembershipSchema>, actorUserId?: string | null, actorRoles: string[] = []) {
  if (!canGrantRole(actorRoles, input.role)) throw new Error("ROLE_GRANT_DENIED");
  const db = getDb();
  const existing = await db.select().from(organizationMemberships).where(eq(organizationMemberships.userId, input.userId));
  const dup = existing.find((m) => m.organizationId === input.organizationId);
  if (dup) throw new Error("DUPLICATE_MEMBERSHIP");
  const [row] = await db.insert(organizationMemberships).values({
    userId: input.userId,
    organizationId: input.organizationId,
    role: input.role,
  }).returning();
  try {
    await recordAudit(db, { actorUserId, organizationId: input.organizationId, action: "membership.org.create", resourceType: "organization_membership", resourceId: row.id, metadata: { userId: input.userId, role: input.role } });
  } catch {}
  return row;
}

export async function addOutletMembership(input: { userId: string; outletId: string; role: string }, actorUserId?: string | null, actorRoles: string[] = []) {
  if (!canGrantRole(actorRoles, input.role)) throw new Error("ROLE_GRANT_DENIED");
  const db = getDb();
  const existing = await db.select().from(outletMemberships).where(eq(outletMemberships.userId, input.userId));
  const dup = existing.find((m) => m.outletId === input.outletId);
  if (dup) throw new Error("DUPLICATE_MEMBERSHIP");
  const [row] = await db.insert(outletMemberships).values({
    userId: input.userId,
    outletId: input.outletId,
    role: input.role,
  }).returning();
  const outletRows = await db.select().from(outlets).where(eq(outlets.id, input.outletId)).limit(1);
  try {
    await recordAudit(db, { actorUserId, organizationId: outletRows[0]?.organizationId ?? null, outletId: input.outletId, action: "membership.outlet.create", resourceType: "outlet_membership", resourceId: row.id, metadata: { userId: input.userId, role: input.role } });
  } catch {}
  return row;
}

export async function removeOrgMembership(membershipId: string, actorUserId?: string | null, actorRoles: string[] = []) {
  const db = getDb();
  const rows = await db.select().from(organizationMemberships).where(eq(organizationMemberships.id, membershipId)).limit(1);
  if (rows.length === 0) throw new Error("MEMBERSHIP_NOT_FOUND");
  const mem = rows[0];
  // last owner protection
  if (mem.role === "owner") {
    const owners = await db.select().from(organizationMemberships).where(eq(organizationMemberships.organizationId, mem.organizationId));
    const ownerCount = owners.filter((m) => m.role === "owner").length;
    if (ownerCount <= 1) throw new Error("LAST_OWNER_PROTECTED");
  }
  await db.delete(organizationMemberships).where(eq(organizationMemberships.id, membershipId));
  try {
    await recordAudit(db, { actorUserId, organizationId: mem.organizationId, action: "membership.org.remove", resourceType: "organization_membership", resourceId: membershipId, metadata: { userId: mem.userId, role: mem.role } });
  } catch {}
  return { ok: true };
}

export async function removeOutletMembership(membershipId: string, actorUserId?: string | null, actorRoles: string[] = []) {
  const db = getDb();
  const rows = await db.select().from(outletMemberships).where(eq(outletMemberships.id, membershipId)).limit(1);
  if (rows.length === 0) throw new Error("MEMBERSHIP_NOT_FOUND");
  const mem = rows[0];
  await db.delete(outletMemberships).where(eq(outletMemberships.id, membershipId));
  const outletRows = await db.select().from(outlets).where(eq(outlets.id, mem.outletId)).limit(1);
  try {
    await recordAudit(db, { actorUserId, organizationId: outletRows[0]?.organizationId ?? null, outletId: mem.outletId, action: "membership.outlet.remove", resourceType: "outlet_membership", resourceId: membershipId, metadata: { userId: mem.userId, role: mem.role } });
  } catch {}
  return { ok: true };
}

export async function updateOutletMembershipRole(membershipId: string, role: string, actorUserId?: string | null, actorRoles: string[] = []) {
  if (!canGrantRole(actorRoles, role)) throw new Error("ROLE_GRANT_DENIED");
  const db = getDb();
  const rows = await db.select().from(outletMemberships).where(eq(outletMemberships.id, membershipId)).limit(1);
  if (rows.length === 0) throw new Error("MEMBERSHIP_NOT_FOUND");
  const mem = rows[0];
  const [row] = await db.update(outletMemberships).set({ role }).where(eq(outletMemberships.id, membershipId)).returning();
  const outletRows = await db.select().from(outlets).where(eq(outlets.id, mem.outletId)).limit(1);
  try {
    await recordAudit(db, { actorUserId, organizationId: outletRows[0]?.organizationId ?? null, outletId: mem.outletId, action: "membership.outlet.role.update", resourceType: "outlet_membership", resourceId: membershipId, metadata: { userId: mem.userId, from: mem.role, to: role } });
  } catch {}
  return row;
}

export async function updateOrgMembershipRole(membershipId: string, role: string, actorUserId?: string | null, actorRoles: string[] = []) {
  if (!canGrantRole(actorRoles, role)) throw new Error("ROLE_GRANT_DENIED");
  const db = getDb();
  const rows = await db.select().from(organizationMemberships).where(eq(organizationMemberships.id, membershipId)).limit(1);
  if (rows.length === 0) throw new Error("MEMBERSHIP_NOT_FOUND");
  const mem = rows[0];
  // owner protection: cannot demote last owner
  if (mem.role === "owner" && role !== "owner") {
    const owners = await db.select().from(organizationMemberships).where(eq(organizationMemberships.organizationId, mem.organizationId));
    const ownerCount = owners.filter((m) => m.role === "owner").length;
    if (ownerCount <= 1) throw new Error("LAST_OWNER_PROTECTED");
  }
  const [row] = await db.update(organizationMemberships).set({ role }).where(eq(organizationMemberships.id, membershipId)).returning();
  try {
    await recordAudit(db, { actorUserId, organizationId: mem.organizationId, action: "membership.org.role.update", resourceType: "organization_membership", resourceId: membershipId, metadata: { userId: mem.userId, from: mem.role, to: role } });
  } catch {}
  return row;
}
