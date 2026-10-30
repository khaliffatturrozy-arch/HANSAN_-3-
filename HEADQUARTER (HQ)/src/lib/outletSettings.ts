import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { outletSettings, outlets } from "@/db/schema";
import { z } from "zod";

export function isValidTimezone(tz: string): boolean {
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; }
}

const businessHoursDaySchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
  closed: z.boolean(),
});

export const settingsSchema = z.object({
  timezone: z.string().min(1).refine(isValidTimezone, { message: "Invalid IANA timezone" }),
  businessHours: z.record(z.string(), businessHoursDaySchema).optional().nullable(),
  kitchenActive: z.boolean(),
  barActive: z.boolean(),
  kitchenName: z.string().min(1).max(60),
  barName: z.string().min(1).max(60),
  kitchenDisplayOrder: z.number().int().min(0),
  barDisplayOrder: z.number().int().min(0),
  acceptOrders: z.boolean(),
});

export type OutletSettingsInput = z.infer<typeof settingsSchema>;

const DEFAULTS: OutletSettingsInput = {
  timezone: "Asia/Jakarta",
  kitchenActive: true,
  barActive: true,
  kitchenName: "Kitchen",
  barName: "Bar",
  kitchenDisplayOrder: 0,
  barDisplayOrder: 1,
  acceptOrders: true,
  businessHours: null,
};

export async function getSettings(outletId: string) {
  const db = getDb();
  const rows = await db.select().from(outletSettings).where(eq(outletSettings.outletId, outletId)).limit(1);
  if (rows.length === 0) return { ...DEFAULTS, outletId };
  const r = rows[0];
  return {
    outletId,
    timezone: r.timezone,
    kitchenActive: r.kitchenActive === "true",
    barActive: r.barActive === "true",
    kitchenName: r.kitchenName,
    barName: r.barName,
    kitchenDisplayOrder: Number(r.kitchenDisplayOrder),
    barDisplayOrder: Number(r.barDisplayOrder),
    acceptOrders: r.acceptOrders === "true",
    businessHours: r.businessHours ?? null,
  };
}

export async function upsertSettings(outletId: string, organizationId: string, input: OutletSettingsInput) {
  const db = getDb();
  const values = {
    organizationId,
    outletId,
    timezone: input.timezone,
    businessHours: input.businessHours ?? null,
    kitchenActive: String(input.kitchenActive),
    barActive: String(input.barActive),
    kitchenName: input.kitchenName,
    barName: input.barName,
    kitchenDisplayOrder: String(input.kitchenDisplayOrder),
    barDisplayOrder: String(input.barDisplayOrder),
    acceptOrders: String(input.acceptOrders),
    updatedAt: new Date(),
  };
  const existing = await db.select().from(outletSettings).where(eq(outletSettings.outletId, outletId)).limit(1);
  if (existing.length > 0) {
    const [row] = await db.update(outletSettings).set(values).where(eq(outletSettings.outletId, outletId)).returning();
    return row;
  }
  const [row] = await db.insert(outletSettings).values(values).returning();
  return row;
}

export function isStationActive(settings: any, station: string): boolean {
  if (station === "kitchen") return settings.kitchenActive === true || settings.kitchenActive === "true";
  if (station === "bar") return settings.barActive === true || settings.barActive === "true";
  return true;
}

export function isOutletOpen(settings: any, now: Date = new Date()): boolean {
  const bh = settings.businessHours;
  if (!bh) return true;
  const tz = settings.timezone || "UTC";
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false });
  const parts = fmt.formatToParts(now);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  const timeStr = `${hh}:${mm}`;
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayMap: Record<string, string> = { Sun: "sun", Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat" };
  const dayKey = dayMap[wd] ?? "mon";
  const idx = dayNames.indexOf(wd);
  const prevKey = dayMap[dayNames[(idx + 6) % 7]] ?? "sun";

  const prevSched = bh[prevKey];
  if (prevSched && !prevSched.closed && prevSched.close < prevSched.open) {
    if (timeStr < prevSched.close) return true;
  }

  const sched = bh[dayKey];
  if (!sched || sched.closed) return false;
  if (sched.close > sched.open) {
    return timeStr >= sched.open && timeStr < sched.close;
  }
  return timeStr >= sched.open || timeStr < sched.close;
}
