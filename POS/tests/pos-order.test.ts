import { describe, it, expect, beforeEach } from "vitest";
import { addItem, updateQty, removeItem, computeTotals } from "../src/domain/pos/cart";
import { createOrder, _resetForTests, getOrder } from "../src/domain/pos/order";

describe("pos cart", () => {
  it("adds and aggregates", () => {
    let cart: any[] = [];
    cart = addItem(cart, { id: "m1", name: "Wrap", price: 100, station: "kitchen" });
    cart = addItem(cart, { id: "m1", name: "Wrap", price: 100, station: "kitchen" }, 2);
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(3);
    const t = computeTotals(cart, 10);
    expect(t.subtotal).toBe(300);
    expect(t.tax).toBe(30);
    expect(t.total).toBe(330);
  });

  it("updates and removes", () => {
    let cart: any[] = [];
    cart = addItem(cart, { id: "m1", name: "Wrap", price: 100, station: "kitchen" });
    cart = updateQty(cart, "m1", 0);
    expect(cart).toHaveLength(0);
    cart = addItem(cart, { id: "m2", name: "Salad", price: 50, station: "kitchen" });
    cart = removeItem(cart, "m2");
    expect(cart).toHaveLength(0);
  });
});

describe("pos order idempotency", () => {
  beforeEach(() => _resetForTests());
  it("prevents duplicate on same key", () => {
    const lines = [{ itemId: "m1", name: "Wrap", price: 100, qty: 2, station: "kitchen" as const }];
    const r1 = createOrder({ lines, subtotal: 200, tax: 0, total: 200, idempotencyKey: "k1" });
    const r2 = createOrder({ lines, subtotal: 200, tax: 0, total: 200, idempotencyKey: "k1" });
    expect(r1.duplicate).toBe(false);
    expect(r2.duplicate).toBe(true);
    expect(r1.order.id).toBe(r2.order.id);
    expect(getOrder(r1.order.id)?.total).toBe(200);
  });
});
