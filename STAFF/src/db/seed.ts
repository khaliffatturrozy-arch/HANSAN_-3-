import { getDb } from "./index";
import { organizations, outlets, users, organizationMemberships, outletMemberships, roles, permissions } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  const db = getDb();
  let org = (await db.select().from(organizations).where(eq(organizations.slug, "demo")))[0];
  if (!org) {
    [org] = await db.insert(organizations).values({ name: "Demo Organization", slug: "demo" }).returning();
  }
  let outlet = (await db.select().from(outlets).where(eq(outlets.slug, "main")))[0];
  if (!outlet) {
    [outlet] = await db.insert(outlets).values({ organizationId: org.id, name: "Main Outlet", slug: "main" }).returning();
  }
  // roles
  const roleKeys = ["owner", "admin", "manager", "staff", "pos", "kds", "finance", "developer"];
  for (const k of roleKeys) {
    const ex = (await db.select().from(roles).where(eq(roles.key, k)))[0];
    if (!ex) await db.insert(roles).values({ key: k, description: k });
  }
  // demo user
  const demoSupabaseId = "demo-user-00000000-0000-0000-0000-000000000000";
  let user = (await db.select().from(users).where(eq(users.supabaseUserId, demoSupabaseId)))[0];
  if (!user) {
    [user] = await db.insert(users).values({ supabaseUserId: demoSupabaseId, email: "demo@hansan.local", displayName: "Demo User" }).returning();
  }
  // memberships
  const om = await db.select().from(organizationMemberships).where(eq(organizationMemberships.userId, user.id));
  if (om.length === 0) {
    await db.insert(organizationMemberships).values({ userId: user.id, organizationId: org.id, role: "owner" });
  }
  const olm = await db.select().from(outletMemberships).where(eq(outletMemberships.userId, user.id));
  if (olm.length === 0) {
    await db.insert(outletMemberships).values({ userId: user.id, outletId: outlet.id, role: "owner" });
  }
  console.log("Seed complete. Org:", org.id, "Outlet:", outlet.id);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

