import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { inventoryMaterials, inventoryStock, inventoryMovements, stockOpnameSessions, stockOpnameItems } from "@/db/schema";
import { z } from "zod";

export const createMaterialSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(120),
  sku: z.string().max(60).optional().nullable(),
  category: z.string().max(60).optional().nullable(),
  baseUnit: z.enum(["g", "kg", "ml", "l", "pcs", "pack"]),
  minStock: z.number().nonnegative().optional(),
});

export async function listMaterials(organizationId: string) {
  const db = getDb();
  return db.select().from(inventoryMaterials).where(eq(inventoryMaterials.organizationId, organizationId));
}

export async function createMaterial(input: z.infer<typeof createMaterialSchema>) {
  const db = getDb();
  const [row] = await db.insert(inventoryMaterials).values({
    organizationId: input.organizationId,
    name: input.name,
    sku: input.sku ?? null,
    category: input.category ?? null,
    baseUnit: input.baseUnit,
    minStock: String(input.minStock ?? 0),
    active: "true",
  }).returning();
  return row;
}

export async function getStock(outletId: string, materialId: string) {
  const db = getDb();
  const rows = await db.select().from(inventoryStock).where(eq(inventoryStock.outletId, outletId));
  return rows.find((r) => r.materialId === materialId) ?? null;
}

export async function listStock(outletId: string) {
  const db = getDb();
  return db.select().from(inventoryStock).where(eq(inventoryStock.outletId, outletId));
}

export async function adjustStock(params: { outletId: string; materialId: string; quantity: number; type: string; reason?: string | null; actorUserId?: string | null; reference?: string | null }) {
  const db = getDb();
  const existing = await getStock(params.outletId, params.materialId);
  const current = existing ? Number(existing.quantity) : 0;
  const next = current + params.quantity;
  if (existing) {
    await db.update(inventoryStock).set({ quantity: String(next), updatedAt: new Date() }).where(eq(inventoryStock.id, existing.id));
  } else {
    await db.insert(inventoryStock).values({ outletId: params.outletId, materialId: params.materialId, quantity: String(next) });
  }
  const [movement] = await db.insert(inventoryMovements).values({
    organizationId: (await db.select().from(inventoryMaterials).where(eq(inventoryMaterials.id, params.materialId)).limit(1))[0].organizationId,
    outletId: params.outletId,
    materialId: params.materialId,
    type: params.type,
    quantity: String(params.quantity),
    unit: (await db.select().from(inventoryMaterials).where(eq(inventoryMaterials.id, params.materialId)).limit(1))[0].baseUnit,
    reference: params.reference ?? null,
    reason: params.reason ?? null,
    actorUserId: params.actorUserId ?? null,
  }).returning();
  return { stock: next, movement };
}

export async function listMovements(outletId: string) {
  const db = getDb();
  return db.select().from(inventoryMovements).where(eq(inventoryMovements.outletId, outletId));
}

export async function createOpnameSession(outletId: string, organizationId: string) {
  const db = getDb();
  const [row] = await db.insert(stockOpnameSessions).values({ organizationId, outletId, status: "open" }).returning();
  return row;
}

export async function addOpnameItem(sessionId: string, materialId: string, expectedQty: number, actualQty: number) {
  const db = getDb();
  const [row] = await db.insert(stockOpnameItems).values({
    sessionId,
    materialId,
    expectedQty: String(expectedQty),
    actualQty: String(actualQty),
    variance: String(actualQty - expectedQty),
  }).returning();
  return row;
}

export async function completeOpname(sessionId: string) {
  const db = getDb();
  const [row] = await db.update(stockOpnameSessions).set({ status: "completed", completedAt: new Date() }).where(eq(stockOpnameSessions.id, sessionId)).returning();
  return row;
}
