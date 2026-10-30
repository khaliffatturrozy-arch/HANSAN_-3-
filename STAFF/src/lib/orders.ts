import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, orderItems, orderStationTickets, orderStatusHistory, orderEvents } from "@/db/schema";

export type Station = "kitchen" | "bar";
export type OrderStatus = "pending" | "in_progress" | "ready" | "cancelled";
export type StationStatus = "new" | "preparing" | "ready" | "cancelled";

const STATION_STATUSES: StationStatus[] = ["new", "preparing", "ready", "cancelled"];

export function deriveOrderStatus(ticketStatuses: StationStatus[]): OrderStatus {
  if (ticketStatuses.length === 0) return "ready";
  if (ticketStatuses.includes("cancelled")) return "cancelled";
  if (ticketStatuses.every((s) => s === "ready")) return "ready";
  if (ticketStatuses.some((s) => s === "preparing" || s === "ready")) return "in_progress";
  return "pending";
}

export interface CreateOrderInput {
  organizationId: string;
  outletId: string;
  idempotencyKey: string;
  createdBy?: string | null;
  taxPercent?: number;
  lines: { itemId: string; name: string; price: number; qty: number; station: Station; notes?: string | null }[];
}

export async function createOrder(input: CreateOrderInput) {
  const db = getDb();
  const existing = await db.select().from(orders).where(eq(orders.idempotencyKey, input.idempotencyKey)).limit(1);
  if (existing.length > 0) {
    const order = existing[0];
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const tickets = await db.select().from(orderStationTickets).where(eq(orderStationTickets.orderId, order.id));
    return { order, items, tickets, duplicate: true };
  }

  const subtotal = input.lines.reduce((s, l) => s + l.price * l.qty, 0);
  const tax = Math.round(subtotal * (input.taxPercent ?? 0) / 100);
  const total = subtotal + tax;
  const stations = Array.from(new Set(input.lines.map((l) => l.station)));

  const result = await db.transaction(async (tx) => {
    const [order] = await tx.insert(orders).values({
      organizationId: input.organizationId,
      outletId: input.outletId,
      status: "pending",
      subtotal: String(subtotal),
      tax: String(tax),
      total: String(total),
      idempotencyKey: input.idempotencyKey,
      createdBy: input.createdBy ?? null,
    }).returning();

    const items = await tx.insert(orderItems).values(
      input.lines.map((l) => ({
        orderId: order.id,
        itemId: l.itemId,
        name: l.name,
        station: l.station,
        price: String(l.price),
        qty: String(l.qty),
        subtotal: String(l.price * l.qty),
        notes: l.notes ?? null,
      }))
    ).returning();

    const tickets = await tx.insert(orderStationTickets).values(
      stations.map((s) => ({ orderId: order.id, station: s, status: "new" }))
    ).returning();

    await tx.insert(orderStatusHistory).values({
      orderId: order.id,
      fromStatus: null,
      toStatus: "pending",
      actorUserId: input.createdBy ?? null,
      metadata: { action: "create" },
    });

    // transactional outbox (same transaction)
    await tx.insert(orderEvents).values({
      eventType: "order.created",
      version: "1",
      organizationId: input.organizationId,
      outletId: input.outletId,
      orderId: order.id,
      station: null,
      payload: null,
    });
    for (const t of tickets) {
      await tx.insert(orderEvents).values({
        eventType: "station_ticket.created",
        version: "1",
        organizationId: input.organizationId,
        outletId: input.outletId,
        orderId: order.id,
        station: t.station,
        payload: null,
      });
    }

    return { order, items, tickets, duplicate: false };
  });

  return result;
}

export async function getOrder(orderId: string) {
  const db = getDb();
  const orderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (orderRows.length === 0) return null;
  const order = orderRows[0];
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const tickets = await db.select().from(orderStationTickets).where(eq(orderStationTickets.orderId, orderId));
  const history = await db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, orderId));
  return { order, items, tickets, history };
}

export async function listOrders(filters: { organizationId: string; outletId?: string; status?: string; limit?: number; offset?: number }) {
  const db = getDb();
  const rows = await db.select().from(orders).where(eq(orders.organizationId, filters.organizationId));
  let filtered = rows;
  if (filters.outletId) filtered = filtered.filter((r) => r.outletId === filters.outletId);
  if (filters.status) filtered = filtered.filter((r) => r.status === filters.status);
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 50;
  return filtered.slice(offset, offset + limit);
}

export async function updateStationTicket(ticketId: string, newStatus: StationStatus, actorUserId?: string | null) {
  if (!STATION_STATUSES.includes(newStatus)) throw new Error("INVALID_STATUS");
  const db = getDb();
  const rows = await db.select().from(orderStationTickets).where(eq(orderStationTickets.id, ticketId)).limit(1);
  if (rows.length === 0) throw new Error("TICKET_NOT_FOUND");
  const ticket = rows[0];
  const allowed: Record<StationStatus, StationStatus[]> = {
    new: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: [],
    cancelled: [],
  };
  if (!allowed[ticket.status as StationStatus].includes(newStatus)) {
    throw new Error("INVALID_TRANSITION");
  }
  const orderRows = await db.select().from(orders).where(eq(orders.id, ticket.orderId)).limit(1);
  const orgId = orderRows[0].organizationId;
  const outletId = orderRows[0].outletId;

  const updated = await db.transaction(async (tx) => {
    const [t] = await tx.update(orderStationTickets).set({ status: newStatus, updatedAt: new Date() }).where(eq(orderStationTickets.id, ticketId)).returning();
    const allTickets = await tx.select().from(orderStationTickets).where(eq(orderStationTickets.orderId, ticket.orderId));
    const statuses = allTickets.map((x) => x.status as StationStatus);
    const newOrderStatus = deriveOrderStatus(statuses);
    const oldStatus = orderRows[0].status;
    if (oldStatus !== newOrderStatus) {
      await tx.update(orders).set({ status: newOrderStatus, updatedAt: new Date() }).where(eq(orders.id, ticket.orderId));
      await tx.insert(orderStatusHistory).values({
        orderId: ticket.orderId,
        fromStatus: oldStatus,
        toStatus: newOrderStatus,
        actorUserId: actorUserId ?? null,
        metadata: { action: "station_update", ticketId, newStatus },
      });
    }
    const evType = newStatus === "ready" ? "station_ticket.ready" : "station_ticket.updated";
    await tx.insert(orderEvents).values({
      eventType: evType,
      version: "1",
      organizationId: orgId,
      outletId,
      orderId: ticket.orderId,
      station: ticket.station,
      payload: null,
    });
    await tx.insert(orderEvents).values({
      eventType: "order.updated",
      version: "1",
      organizationId: orgId,
      outletId,
      orderId: ticket.orderId,
      station: null,
      payload: null,
    });
    return t;
  });
  try {
    await (await import("@/lib/audit")).recordAudit(getDb(), {
      actorUserId: actorUserId ?? null,
      action: "station_ticket_update",
      resourceType: "order_station_ticket",
      resourceId: ticketId,
      metadata: { newStatus },
    });
  } catch { /* ignore */ }
  return updated;
}

export async function cancelOrder(orderId: string, actorUserId?: string | null) {
  const db = getDb();
  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (rows.length === 0) throw new Error("ORDER_NOT_FOUND");
  const order = rows[0];
  if (order.status === "cancelled" || order.status === "ready") throw new Error("ORDER_NOT_CANCELLABLE");
  await db.transaction(async (tx) => {
    await tx.update(orders).set({ status: "cancelled", updatedAt: new Date() }).where(eq(orders.id, orderId));
    await tx.update(orderStationTickets).set({ status: "cancelled", updatedAt: new Date() }).where(eq(orderStationTickets.orderId, orderId));
    await tx.insert(orderStatusHistory).values({
      orderId,
      fromStatus: order.status,
      toStatus: "cancelled",
      actorUserId: actorUserId ?? null,
      metadata: { action: "cancel" },
    });
    await tx.insert(orderEvents).values({
      eventType: "order.cancelled",
      version: "1",
      organizationId: order.organizationId,
      outletId: order.outletId,
      orderId,
      station: null,
      payload: null,
    });
  });
  try {
    await (await import("@/lib/audit")).recordAudit(getDb(), {
      actorUserId: actorUserId ?? null,
      action: "order_cancel",
      resourceType: "order",
      resourceId: orderId,
      metadata: {},
    });
  } catch { /* ignore */ }
  return { ok: true };
}
