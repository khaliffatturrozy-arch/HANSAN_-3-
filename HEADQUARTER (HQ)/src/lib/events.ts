export type EventType =
  | "order.created"
  | "order.updated"
  | "order.cancelled"
  | "station_ticket.created"
  | "station_ticket.updated"
  | "station_ticket.ready";

export interface OrderEvent {
  id: string;
  type: EventType;
  version: "1";
  organizationId: string;
  outletId: string;
  orderId: string;
  station?: string | null;
  timestamp: string;
}

export const EVENT_TYPES: EventType[] = [
  "order.created", "order.updated", "order.cancelled",
  "station_ticket.created", "station_ticket.updated", "station_ticket.ready",
];

import { getDb } from "@/db";
import { orderEvents } from "@/db/schema";

export async function publishEvent(event: Omit<OrderEvent, "id" | "timestamp">) {
  const db = getDb();
  const [row] = await db.insert(orderEvents).values({
    eventType: event.type,
    version: event.version,
    organizationId: event.organizationId,
    outletId: event.outletId,
    orderId: event.orderId,
    station: event.station ?? null,
    payload: null,
  }).returning();
  return row;
}
