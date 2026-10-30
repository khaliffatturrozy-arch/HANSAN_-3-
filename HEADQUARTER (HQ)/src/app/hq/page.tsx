"use client";
import * as React from "react";
import { PageHeader, Card, CardTitle, CardDescription, EmptyState, Badge, Button } from "@/components/ui";

interface Overview { totalOrders: number; completedOrders: number; cancelledOrders: number; activeOrders: number; averageOrderValue: number | null; totalRevenue: number | null; }
interface LiveOps { pending: number; inProgress: number; ready: number; cancelled: number; }
interface OutletPerf { outletId: string; outletName: string; status: string; orderCount: number; completedCount: number; cancelledCount: number; activeCount: number; kitchenActive: boolean; barActive: boolean; acceptOrders: boolean; }
interface Station { station: string; pending: number; preparing: number; ready: number; active: boolean; displayName: string; }
interface VolumePoint { date: string; count: number; }
interface Alert { severity: string; outlet: string; message: string; }

export default function HqDashboardPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ orgSlug: "demo" });
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      const res = await fetch(`/api/dashboard?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error("Failed to load dashboard");
      setData(json);
    } catch {
      setError("Failed to load dashboard. Retry.");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  React.useEffect(() => { load(); }, [load]);

  const overview: Overview | null = data?.overview ?? null;
  const liveOps: LiveOps | null = data?.liveOps ?? null;
  const outlets: OutletPerf[] = data?.outletPerformance ?? [];
  const stations: Station[] = data?.stations ?? [];
  const volume: VolumePoint[] = data?.volume ?? [];
  const alerts: Alert[] = data?.alerts ?? [];
  const maxVolume = Math.max(1, ...volume.map((v) => v.count));

  return (
    <>
      <PageHeader eyebrow="Headquarter" title="Dashboard" description="Operational overview based on authorized data." />
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-hansan-ink-muted">From</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-sm border border-hansan-line bg-hansan-surface-raised px-3 py-2 text-sm text-hansan-ink" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-hansan-ink-muted">To</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-sm border border-hansan-line bg-hansan-surface-raised px-3 py-2 text-sm text-hansan-ink" />
        </div>
        <Button onClick={load} className="w-full sm:w-auto">Apply</Button>
        <Button variant="secondary" onClick={() => { setFromDate(""); setToDate(""); }} className="w-full sm:w-auto">Reset</Button>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-hansan-ink-muted">Loading dashboard…</p>
      ) : error ? (
        <div className="mt-6"><p className="text-sm text-hansan-danger" role="alert">{error}</p><Button onClick={load} className="mt-3">Retry</Button></div>
      ) : (
        <>
          {/* Business overview */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardTitle className="text-sm">Total orders</CardTitle><p className="mt-1 text-2xl font-black text-hansan-ink">{overview?.totalOrders ?? 0}</p></Card>
            <Card><CardTitle className="text-sm">Active</CardTitle><p className="mt-1 text-2xl font-black text-hansan-ink">{overview?.activeOrders ?? 0}</p></Card>
            <Card><CardTitle className="text-sm">Completed</CardTitle><p className="mt-1 text-2xl font-black text-hansan-success">{overview?.completedOrders ?? 0}</p></Card>
            <Card><CardTitle className="text-sm">Cancelled</CardTitle><p className="mt-1 text-2xl font-black text-hansan-danger">{overview?.cancelledOrders ?? 0}</p></Card>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Card><CardTitle className="text-sm">Avg order value</CardTitle><p className="mt-1 text-xl font-black text-hansan-ink">{overview?.averageOrderValue != null ? overview.averageOrderValue.toLocaleString("id-ID") : "Unavailable"}</p></Card>
            <Card><CardTitle className="text-sm">Total revenue</CardTitle><p className="mt-1 text-xl font-black text-hansan-ink-muted">{overview?.totalRevenue != null ? overview.totalRevenue.toLocaleString("id-ID") : "Not supported yet"}</p></Card>
          </div>

          {/* Live ops */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-hansan-ink-muted">Live operations</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <Card><CardTitle className="text-sm">Pending</CardTitle><p className="mt-1 text-2xl font-black text-hansan-ink">{liveOps?.pending ?? 0}</p></Card>
              <Card><CardTitle className="text-sm">In progress</CardTitle><p className="mt-1 text-2xl font-black text-hansan-ink">{liveOps?.inProgress ?? 0}</p></Card>
              <Card><CardTitle className="text-sm">Ready</CardTitle><p className="mt-1 text-2xl font-black text-hansan-success">{liveOps?.ready ?? 0}</p></Card>
              <Card><CardTitle className="text-sm">Cancelled</CardTitle><p className="mt-1 text-2xl font-black text-hansan-danger">{liveOps?.cancelled ?? 0}</p></Card>
            </div>
          </div>

          {/* Station workload */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-hansan-ink-muted">Station workload</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {stations.map((s) => (
                <Card key={s.station}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{s.displayName}</CardTitle>
                    <Badge tone={s.active ? "success" : "muted"}>{s.active ? "active" : "inactive"}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                    <div><p className="text-xs text-hansan-ink-muted">Pending</p><p className="font-mono font-bold">{s.pending}</p></div>
                    <div><p className="text-xs text-hansan-ink-muted">Preparing</p><p className="font-mono font-bold">{s.preparing}</p></div>
                    <div><p className="text-xs text-hansan-ink-muted">Ready</p><p className="font-mono font-bold">{s.ready}</p></div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Outlet performance */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-hansan-ink-muted">Outlet performance</h2>
            <div className="mt-3 flex flex-col gap-3">
              {outlets.length === 0 ? (
                <EmptyState title="No outlets" description="No authorized outlets found." />
              ) : (
                outlets.map((o) => (
                  <Card key={o.outletId}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-base">{o.outletName}</CardTitle>
                      <Badge tone={o.status === "active" ? "success" : "muted"}>{o.status}</Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
                      <div><p className="text-hansan-ink-muted">Orders</p><p className="font-mono font-bold text-hansan-ink">{o.orderCount}</p></div>
                      <div><p className="text-hansan-ink-muted">Completed</p><p className="font-mono font-bold text-hansan-success">{o.completedCount}</p></div>
                      <div><p className="text-hansan-ink-muted">Cancelled</p><p className="font-mono font-bold text-hansan-danger">{o.cancelledCount}</p></div>
                      <div><p className="text-hansan-ink-muted">Active</p><p className="font-mono font-bold text-hansan-ink">{o.activeCount}</p></div>
                    </div>
                    <div className="mt-2 flex gap-2 text-xs text-hansan-ink-muted">
                      <span>Kitchen: {o.kitchenActive ? "active" : "inactive"}</span>
                      <span>Bar: {o.barActive ? "active" : "inactive"}</span>
                      <span>Accepts orders: {o.acceptOrders ? "yes" : "no"}</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Order volume chart (CSS bars) */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-hansan-ink-muted">Order volume</h2>
            <Card className="mt-3">
              {volume.length === 0 ? (
                <EmptyState title="No data" description="No orders in the selected period." />
              ) : (
                <div className="flex items-end gap-1 overflow-x-auto py-2" style={{ minHeight: 120 }}>
                  {volume.map((v) => (
                    <div key={v.date} className="flex flex-col items-center gap-1" style={{ minWidth: 24 }}>
                      <div className="w-4 rounded-sm bg-hansan-orange" style={{ height: `${(v.count / maxVolume) * 80}px`, minHeight: v.count > 0 ? 4 : 0 }} title={`${v.date}: ${v.count}`} />
                      <span className="text-[10px] text-hansan-ink-muted">{v.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-hansan-ink-muted">Operational alerts</h2>
              <div className="mt-3 flex flex-col gap-2">
                {alerts.map((a, i) => (
                  <div key={i} className="rounded-sm border border-hansan-line bg-hansan-surface-raised px-3 py-2 text-sm">
                    <span className="font-semibold text-hansan-ink">{a.outlet}</span>
                    <span className="ml-2 text-hansan-ink-muted">{a.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
