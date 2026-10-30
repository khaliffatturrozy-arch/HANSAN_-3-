import type { CartItem } from "./cart";

export interface OrderLine {
  itemId: string;
  name: string;
  price: number;
  qty: number;
  station: "kitchen" | "bar";
}

export interface Order {
  id: string;
  lines: OrderLine[];
  subtotal: number;
  tax: number;
  total: number;
  status: "created" | "paid" | "cancelled";
  createdAt: string;
}

export interface CreateOrderInput {
  lines: OrderLine[];
  subtotal: number;
  tax: number;
  total: number;
  idempotencyKey: string;
}

// In-memory store (DEMO). Not persisted. Honest about limits.
const orders = new Map<string, Order>();
const idempotency = new Map<string, string>(); // key -> orderId

export function createOrder(input: CreateOrderInput): { order: Order; duplicate: boolean } {
  const existingId = idempotency.get(input.idempotencyKey);
  if (existingId) {
    const existing = orders.get(existingId);
    if (existing) return { order: existing, duplicate: true };
  }
  const id = `ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const order: Order = {
    id,
    lines: input.lines,
    subtotal: input.subtotal,
    tax: input.tax,
    total: input.total,
    status: "created",
    createdAt: new Date().toISOString(),
  };
  orders.set(id, order);
  idempotency.set(input.idempotencyKey, id);
  return { order, duplicate: false };
}

export function getOrder(id: string): Order | null {
  return orders.get(id) ?? null;
}

export function _resetForTests() {
  orders.clear();
  idempotency.clear();
}
