import { eq, and, gte, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, orderItems, orderStationTickets, outlets, outletSettings } from "@/db/schema";

export interface DashboardFilters {
  organizationId: string;
  outletIds: string[]; // authorized outlets
  from: Date;
  to: Date;
}

export interface BusinessOverview {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  activeOrders: number;
  averageOrderValue: number | null;
  totalRevenue: number | null;
}

export async function getBusinessOverview(f: DashboardFilters): Promise<BusinessOverview> {
  const db = getDb();
  const rows = await db.select().from(orders).where(eq(orders.organizationId, f.organizationId));
  const scoped = rows.filter((o) => f.outletIds.includes(o.outletId));
  const inRange = scoped.filter((o) => {
    const t = new Date(o.createdAt).getTime();
    return t >= f.from.getTime() && t <= f.to.getTime();
  });
  const totalOrders = inRange.length;
  const completedOrders = inRange.filter((o) => o.status === "ready" || o.status === "completed").length;
  const cancelledOrders = inRange.filter((o) => o.status === "cancelled").length;
  const activeOrders = inRange.filter((o) => o.status === "pending" || o.status === "in_progress").length;
  const totals = inRange.map((o) => Number(o.total));
  const sum = totals.reduce((a, b) => a + b, 0);
  const averageOrderValue = totalOrders > 0 ? sum / totalOrders : null;
  // revenue only if payment data exists; we don't have it, so null
  const totalRevenue = null;
  return { totalOrders, completedOrders, cancelledOrders, activeOrders, averageOrderValue, totalRevenue };
}

export interface LiveOps {
  pending: number;
  inProgress: number;
  ready: number;
  cancelled: number;
}

export async function getLiveOps(f: DashboardFilters): Promise<LiveOps> {
  const db = getDb();
  const rows = await db.select().from(orders).where(eq(orders.organizationId, f.organizationId));
  const scoped = rows.filter((o) => f.outletIds.includes(o.outletId));
  const inRange = scoped.filter((o) => {
    const t = new Date(o.createdAt).getTime();
    return t >= f.from.getTime() && t <= f.to.getTime();
  });
  return {
    pending: inRange.filter((o) => o.status === "pending").length,
    inProgress: inRange.filter((o) => o.status === "in_progress").length,
    ready: inRange.filter((o) => o.status === "ready").length,
    cancelled: inRange.filter((o) => o.status === "cancelled").length,
  };
}

export interface OutletPerformance {
  outletId: string;
  outletName: string;
  status: string;
  orderCount: number;
  completedCount: number;
  cancelledCount: number;
  activeCount: number;
  kitchenActive: boolean;
  barActive: boolean;
  acceptOrders: boolean;
}

export async function getOutletPerformance(f: DashboardFilters): Promise<OutletPerformance[]> {
  const db = getDb();
  const allOutlets = await db.select().from(outlets);
  const authorized = allOutlets.filter((o) => f.outletIds.includes(o.id) && o.organizationId === f.organizationId);
  const rows = await db.select().from(orders).where(eq(orders.organizationId, f.organizationId));
  const result: OutletPerformance[] = [];
  for (const o of authorized) {
    const outletOrders = rows.filter((r) => r.outletId === o.id).filter((r) => {
      const t = new Date(r.createdAt).getTime();
      return t >= f.from.getTime() && t <= f.to.getTime();
    });
    const settings = await (async () => {
      const s = await db.select().from(outletSettings).where(eq(outletSettings.outletId, o.id)).limit(1);
      return s[0] ?? null;
    })();
    result.push({
      outletId: o.id,
      outletName: o.name,
      status: o.status,
      orderCount: outletOrders.length,
      completedCount: outletOrders.filter((r) => r.status === "ready").length,
      cancelledCount: outletOrders.filter((r) => r.status === "cancelled").length,
      activeCount: outletOrders.filter((r) => r.status === "pending" || r.status === "in_progress").length,
      kitchenActive: settings ? settings.kitchenActive === "true" : true,
      barActive: settings ? settings.barActive === "true" : true,
      acceptOrders: settings ? settings.acceptOrders === "true" : true,
    });
  }
  return result;
}

export interface StationWorkload {
  station: "kitchen" | "bar";
  pending: number;
  preparing: number;
  ready: number;
  active: boolean;
  displayName: string;
}

export async function getStationWorkload(f: DashboardFilters): Promise<StationWorkload[]> {
  const db = getDb();
  const tickets = await db.select().from(orderStationTickets);
  const orderRows = await db.select().from(orders).where(eq(orders.organizationId, f.organizationId));
  const scopedOrderIds = new Set(orderRows.filter((o) => f.outletIds.includes(o.outletId)).map((o) => o.id));
  const inRangeOrderIds = new Set(orderRows.filter((o) => {
    const t = new Date(o.createdAt).getTime();
    return t >= f.from.getTime() && t <= f.to.getTime() && f.outletIds.includes(o.outletId);
  }).map((o) => o.id));
  const kitchenTickets = tickets.filter((t) => t.station === "kitchen" && inRangeOrderIds.has(t.orderId));
  const barTickets = tickets.filter((t) => t.station === "bar" && inRangeOrderIds.has(t.orderId));
  // settings for first authorized outlet (or aggregate)
  const settings = await (async () => {
    if (f.outletIds.length === 0) return null;
    const s = await db.select().from(outletSettings).where(eq(outletSettings.outletId, f.outletIds[0])).limit(1);
    return s[0] ?? null;
  })();
  return [
    {
      station: "kitchen",
      pending: kitchenTickets.filter((t) => t.status === "new").length,
      preparing: kitchenTickets.filter((t) => t.status === "preparing").length,
      ready: kitchenTickets.filter((t) => t.status === "ready").length,
      active: settings ? settings.kitchenActive === "true" : true,
      displayName: settings?.kitchenName ?? "Kitchen",
    },
    {
      station: "bar",
      pending: barTickets.filter((t) => t.status === "new").length,
      preparing: barTickets.filter((t) => t.status === "preparing").length,
      ready: barTickets.filter((t) => t.status === "ready").length,
      active: settings ? settings.barActive === "true" : true,
      displayName: settings?.barName ?? "Bar",
    },
  ];
}

export interface OrderVolumePoint { date: string; count: number; }

export async function getOrderVolume(f: DashboardFilters): Promise<OrderVolumePoint[]> {
  const db = getDb();
  const rows = await db.select().from(orders).where(eq(orders.organizationId, f.organizationId));
  const scoped = rows.filter((o) => f.outletIds.includes(o.outletId));
  const inRange = scoped.filter((o) => {
    const t = new Date(o.createdAt).getTime();
    return t >= f.from.getTime() && t <= f.to.getTime();
  });
  // group by date (UTC date string)
  const map = new Map<string, number>();
  for (const o of inRange) {
    const d = new Date(o.createdAt).toISOString().slice(0, 10);
    map.set(d, (map.get(d) ?? 0) + 1);
  }
  // fill all dates in range
  const result: OrderVolumePoint[] = [];
  const cur = new Date(f.from);
  cur.setUTCHours(0, 0, 0, 0);
  const end = new Date(f.to);
  end.setUTCHours(0, 0, 0, 0);
  while (cur <= end) {
    const key = cur.toISOString().slice(0, 10);
    result.push({ date: key, count: map.get(key) ?? 0 });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return result;
}

export interface OperationalAlert { severity: "info" | "warning" | "danger"; outlet: string; message: string; }

export async function getOperationalAlerts(f: DashboardFilters): Promise<OperationalAlert[]> {
  const db = getDb();
  const allOutlets = await db.select().from(outlets);
  const authorized = allOutlets.filter((o) => f.outletIds.includes(o.id) && o.organizationId === f.organizationId);
  const alerts: OperationalAlert[] = [];
  for (const o of authorized) {
    const settingsRows = await db.select().from(outletSettings).where(eq(outletSettings.outletId, o.id)).limit(1);
    const s = settingsRows[0];
    if (s && s.acceptOrders === "false") {
      alerts.push({ severity: "warning", outlet: o.name, message: "Outlet not accepting orders." });
    }
    if (s && s.kitchenActive === "false") {
      alerts.push({ severity: "warning", outlet: o.name, message: "Kitchen station inactive." });
    }
    if (s && s.barActive === "false") {
      alerts.push({ severity: "warning", outlet: o.name, message: "Bar station inactive." });
    }
    if (o.status === "inactive") {
      alerts.push({ severity: "info", outlet: o.name, message: "Outlet inactive." });
    }
  }
  return alerts;
}

