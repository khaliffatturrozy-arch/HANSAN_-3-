import { describe, it, expect } from "vitest";
import { isValidTimezone, isOutletOpen } from "@/lib/outletSettings";

describe("isValidTimezone", () => {
  it("accepts valid IANA timezones", () => {
    expect(isValidTimezone("Asia/Jakarta")).toBe(true);
    expect(isValidTimezone("Asia/Makassar")).toBe(true);
    expect(isValidTimezone("Asia/Jayapura")).toBe(true);
    expect(isValidTimezone("UTC")).toBe(true);
    expect(isValidTimezone("America/New_York")).toBe(true);
  });
  it("rejects invalid timezones", () => {
    expect(isValidTimezone("")).toBe(false);
    expect(isValidTimezone("Not/AZone")).toBe(false);
    expect(isValidTimezone("Mars/Olympus")).toBe(false);
  });
});

describe("isOutletOpen", () => {
  const settings = (bh: any, tz = "Asia/Jakarta") => ({ businessHours: bh, timezone: tz, acceptOrders: true });

  it("returns true when no business hours (backward-compatible default)", () => {
    expect(isOutletOpen(settings(null))).toBe(true);
  });

  it("normal day: open within hours", () => {
    const bh = { mon: { open: "09:00", close: "17:00", closed: false } };
    // Monday 12:00 Jakarta = 05:00 UTC
    const now = new Date("2024-01-08T05:00:00Z"); // Monday
    expect(isOutletOpen(settings(bh), now)).toBe(true);
  });

  it("normal day: closed before opening", () => {
    const bh = { mon: { open: "09:00", close: "17:00", closed: false } };
    const now = new Date("2024-01-08T01:00:00Z"); // Monday 08:00 Jakarta
    expect(isOutletOpen(settings(bh), now)).toBe(false);
  });

  it("normal day: closed at/after closing (exclusive)", () => {
    const bh = { mon: { open: "09:00", close: "17:00", closed: false } };
    const now = new Date("2024-01-08T10:00:00Z"); // Monday 17:00 Jakarta
    expect(isOutletOpen(settings(bh), now)).toBe(false);
  });

  it("overnight: Tuesday 01:00 is still Monday schedule", () => {
    const bh = { mon: { open: "18:00", close: "02:00", closed: false }, tue: { open: "09:00", close: "17:00", closed: false } };
    // Tuesday 01:00 Jakarta = Monday 18:00 UTC
    const now = new Date("2024-01-08T18:00:00Z"); // Monday 18:00? wait need Tuesday 01:00 JKT = Monday 18:00 UTC
    expect(isOutletOpen(settings(bh), now)).toBe(true);
  });

  it("closed day returns false", () => {
    const bh = { sun: { open: "09:00", close: "17:00", closed: true } };
    const now = new Date("2024-01-07T05:00:00Z"); // Sunday
    expect(isOutletOpen(settings(bh), now)).toBe(false);
  });
});
