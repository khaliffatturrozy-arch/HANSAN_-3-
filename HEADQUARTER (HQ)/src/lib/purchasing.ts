import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { suppliers, purchaseOrders, purchaseOrderItems, purchaseReceivings, inventoryMaterials, inventoryStock, inventoryMovements } from "@/db/schema";
import { z } from "zod";

export const createSupplierSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(120),
  code: z.string().max(40).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().max(40).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function listSuppliers(organizationId: string) {
  const db = getDb();
  return db.select().from(suppliers).where(eq(suppliers.organizationId, organizationId));
}

export async function createSupplier(input: z.infer<typeof createSupplierSchema>) {
  const db = getDb();
  const [row] = await db.insert(suppliers).values({
    organizationId: input.organizationId,
    name: input.name,
    code: input.code ?? null,
    contactEmail: input.contactEmail ?? null,
    contactPhone: input.contactPhone ?? null,
    address: input.address ?? null,
    active: "true",
  }).returning();
  return row;
}

export interface CreatePOInput {
  organizationId: string;
  outletId: string;
  supplierId?: string | null;
  idempotencyKey: string;
  createdBy?: string | null;
  expectedDelivery?: string | null;
  notes?: string | null;
  lines: { materialId: string; quantity: number; unit: string; unitCost: number }[];
}

export async function createPurchaseOrder(input: CreatePOInput) {
  const db = getDb();
  const existing = await db.select().from(purchaseOrders).where(eq(purchaseOrders.idempotencyKey, input.idempotencyKey)).limit(1);
  if (existing.length > 0) return { order: existing[0], duplicate: true };
  const subtotal = input.lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);
  const result = await db.transaction(async (tx) => {
    const [po] = await tx.insert(purchaseOrders).values({
      organizationId: input.organizationId,
      outletId: input.outletId,
      supplierId: input.supplierId ?? null,
      status: "draft",
      total: String(subtotal),
      idempotencyKey: input.idempotencyKey,
      expectedDelivery: input.expectedDelivery ? new Date(input.expectedDelivery) : null,
      notes: input.notes ?? null,
      createdBy: input.createdBy ?? null,
    }).returning();
    await tx.insert(purchaseOrderItems).values(
      input.lines.map((l) => ({
        purchaseOrderId: po.id,
        materialId: l.materialId,
        quantity: String(l.quantity),
        unit: l.unit,
        unitCost: String(l.unitCost),
        subtotal: String(l.quantity * l.unitCost),
        receivedQty: "0",
      }))
    );
    return po;
  });
  return { order: result, duplicate: false };
}

export async function listPurchaseOrders(organizationId: string, outletId?: string) {
  const db = getDb();
  const rows = await db.select().from(purchaseOrders).where(eq(purchaseOrders.organizationId, organizationId));
  if (outletId) return rows.filter((r) => r.outletId === outletId);
  return rows;
}

export async function getPurchaseOrder(id: string) {
  const db = getDb();
  const rows = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
  if (rows.length === 0) return null;
  const po = rows[0];
  const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));
  const receivings = await db.select().from(purchaseReceivings).where(eq(purchaseReceivings.purchaseOrderId, id));
  return { po, items, receivings };
}

export async function submitPurchaseOrder(id: string) {
  const db = getDb();
  const rows = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
  if (rows.length === 0) throw new Error("PO_NOT_FOUND");
  if (rows[0].status !== "draft") throw new Error("INVALID_STATUS");
  await db.update(purchaseOrders).set({ status: "submitted", updatedAt: new Date() }).where(eq(purchaseOrders.id, id));
  return { ok: true };
}

export async function approvePurchaseOrder(id: string) {
  const db = getDb();
  const rows = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
  if (rows.length === 0) throw new Error("PO_NOT_FOUND");
  if (rows[0].status !== "submitted") throw new Error("INVALID_STATUS");
  await db.update(purchaseOrders).set({ status: "approved", updatedAt: new Date() }).where(eq(purchaseOrders.id, id));
  return { ok: true };
}

export async function receivePurchaseOrder(poId: string, receivedBy: string | null, notes?: string | null) {
  const db = getDb();
  const rows = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, poId)).limit(1);
  if (rows.length === 0) throw new Error("PO_NOT_FOUND");
  const po = rows[0];
  if (po.status !== "approved" && po.status !== "partially_received") throw new Error("INVALID_STATUS");
  const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, poId));
  // idempotency: if already fully received, skip
  const allReceived = items.every((i) => Number(i.receivedQty) >= Number(i.quantity));
  if (allReceived) return { ok: true, duplicate: true };

  await db.transaction(async (tx) => {
    const [receiving] = await tx.insert(purchaseReceivings).values({ purchaseOrderId: poId, receivedBy: receivedBy ?? null, notes: notes ?? null }).returning();
    for (const item of items) {
      const remaining = Number(item.quantity) - Number(item.receivedQty);
      if (remaining <= 0) continue;
      // receive all remaining
      await tx.update(purchaseOrderItems).set({ receivedQty: String(Number(item.quantity)) }).where(eq(purchaseOrderItems.id, item.id));
      // create stock movement
      const matRows = await tx.select().from(inventoryMaterials).where(eq(inventoryMaterials.id, item.materialId)).limit(1);
      const mat = matRows[0];
      const stockRows = await tx.select().from(inventoryStock).where(eq(inventoryStock.outletId, po.outletId));
      const existing = stockRows.find((s) => s.materialId === item.materialId);
      const current = existing ? Number(existing.quantity) : 0;
      const next = current + remaining;
      if (existing) {
        await tx.update(inventoryStock).set({ quantity: String(next), updatedAt: new Date() }).where(eq(inventoryStock.id, existing.id));
      } else {
        await tx.insert(inventoryStock).values({ outletId: po.outletId, materialId: item.materialId, quantity: String(next) });
      }
      await tx.insert(inventoryMovements).values({
        organizationId: po.organizationId,
        outletId: po.outletId,
        materialId: item.materialId,
        type: "purchase_receiving",
        quantity: String(remaining),
        unit: item.unit,
        reference: poId,
        reason: "Purchase order receiving",
        actorUserId: receivedBy ?? null,
      });
    }
    // update PO status
    const updatedItems = await tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, poId));
    const allDone = updatedItems.every((i) => Number(i.receivedQty) >= Number(i.quantity));
    await tx.update(purchaseOrders).set({ status: allDone ? "fully_received" : "partially_received", updatedAt: new Date() }).where(eq(purchaseOrders.id, poId));
  });
  return { ok: true, duplicate: false };
}

export async function cancelPurchaseOrder(id: string) {
  const db = getDb();
  const rows = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
  if (rows.length === 0) throw new Error("PO_NOT_FOUND");
  if (rows[0].status === "fully_received") throw new Error("PO_ALREADY_RECEIVED");
  await db.update(purchaseOrders).set({ status: "cancelled", updatedAt: new Date() }).where(eq(purchaseOrders.id, id));
  return { ok: true };
}
