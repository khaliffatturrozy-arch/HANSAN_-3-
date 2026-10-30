import { describe, it, expect } from "vitest";
import { deriveOrderStatus } from "@/lib/orders";

describe("Order status derivation", () => {
  it("returns ready when all station tickets ready", () => {
    expect(deriveOrderStatus(["ready", "ready"])).toBe("ready");
  });
  it("returns in_progress when some ready/preparing", () => {
    expect(deriveOrderStatus(["ready", "preparing"])).toBe("in_progress");
    expect(deriveOrderStatus(["new", "preparing"])).toBe("in_progress");
  });
  it("returns pending when all new", () => {
    expect(deriveOrderStatus(["new", "new"])).toBe("pending");
  });
  it("returns ready when no tickets", () => {
    expect(deriveOrderStatus([])).toBe("ready");
  });
  it("returns cancelled if any ticket cancelled", () => {
    expect(deriveOrderStatus(["ready", "cancelled"])).toBe("cancelled");
  });
});
