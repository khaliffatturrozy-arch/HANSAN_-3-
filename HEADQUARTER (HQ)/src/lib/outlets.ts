import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { outlets, organizationMemberships } from "@/db/schema";
import { z } from "zod";

export const createOutletSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(120),
  code: z.string().min(1).max(40).regex(/^[A-Z0-9_-]+$/),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/).optional(),
  address: z.string().max(500).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().max(40).optional().nullable(),
});

export const updateOutletSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  code: z.string().min(1).max(40).regex(/^[A-Z0-9_-]+$/).optional(),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/).optional(),
  address: z.string().max(500).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().max(40).optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

export async function listOutlets(organizationId: string) {
  const db = getDb();
  return db.select().from(outlets).where(eq(outlets.organizationId, organizationId));
}

export async function getOutlet(id: string) {
  const db = getDb();
  const rows = await db.select().from(outlets).where(eq(outlets.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createOutlet(input: z.infer<typeof createOutletSchema>) {
  const db = getDb();
  const slug = input.slug ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const [row] = await db.insert(outlets).values({
    organizationId: input.organizationId,
    name: input.name,
    slug,
    code: input.code,
    address: input.address ?? null,
    contactEmail: input.contactEmail ?? null,
    contactPhone: input.contactPhone ?? null,
    status: "active",
  }).returning();
  return row;
}

export async function updateOutlet(id: string, input: z.infer<typeof updateOutletSchema>) {
  const db = getDb();
  const patch: any = { updatedAt: new Date() };
  if (input.name !== undefined) patch.name = input.name;
  if (input.code !== undefined) patch.code = input.code;
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.address !== undefined) patch.address = input.address;
  if (input.contactEmail !== undefined) patch.contactEmail = input.contactEmail;
  if (input.contactPhone !== undefined) patch.contactPhone = input.contactPhone;
  if (input.status !== undefined) {
    patch.status = input.status;
    patch.deactivatedAt = input.status === "inactive" ? new Date() : null;
  }
  const [row] = await db.update(outlets).set(patch).where(eq(outlets.id, id)).returning();
  return row;
}

export async function deactivateOutlet(id: string) {
  return updateOutlet(id, { status: "inactive" });
}

export async function reactivateOutlet(id: string) {
  return updateOutlet(id, { status: "active" });
}
