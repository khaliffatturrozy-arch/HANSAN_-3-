"use client";
import * as React from "react";
import { PageHeader, Card, CardTitle, CardDescription, EmptyState, Badge, Button, Input, Alert } from "@/components/ui";

interface Order { id: string; status: string; outletId: string; total: string; createdAt: string; }
interface OrderDetail { order: Order; items: any[]; tickets: any[]; history: any[]; }

export default function HqOrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [outletFilter, setOutletFilter] = React.useState("");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [offset, setOffset] = React.useState(0);
  const limit = 20;
  const [selected, setSelected] = React.useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelError, setCancelError] = React.useState<string | null>(null);
  const [canceling, setCanceling] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ orgSlug: "demo", limit: String(limit), offset: String(offset) });
      if (statusFilter) params.set("status", statusFilter);
      if (outletFilter) params.set("outletSlug", outletFilter);
      if (search) params.set("search", search);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      const res = await fetch(`/api/orders?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error("Failed to load orders");
      setOrders(json.orders ?? []);
      setTotal(json.total ?? 0);
    } catch {
      setError("Failed to load orders. Retry.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, outletFilter, search, fromDate, toDate, offset]);

  React.useEffect(() => { load(); }, [load]);

  // SSE refresh
  React.useEffect(() => {
    const es = new EventSource("/api/events?orgSlug=demo");
    es.onmessage = () => { load(); };
    es.onerror = () => { es.close(); };
    return () => es.close();
  }, [load]);

  async function openDetail(order: Order) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      const json = await res.json();
      if (res.ok && json?.ok) setSelected(json);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleCancel() {
    if (!selected) return;
    setCanceling(true); setCancelError(null);
    try {
      const res = await fetch(`/api/orders/cancel/${selected.order.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: cancelReason }) });
      const json = await res.json();
      if (!res.ok || !json?.ok) { setCancelError(json?.error?.message ?? "Cancel failed"); return; }
      setCancelOpen(false); setCancelReason(""); setSelected(null); load();
    } catch {
      setCancelError("Network error");
    } finally {
      setCanceling(false);
    }
  }

  const counts = React.useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  return (
    <>
      <PageHeader eyebrow="Headquarter" title="Orders" description="Read-only and management view of authorized orders." />
      {/* stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {["pending", "in_progress", "ready", "cancelled"].map((s) => (
          <Card key={s}><CardTitle className="text-sm">{s}</CardTitle><p className="mt-1 text-2xl font-black text-hansan-ink">{counts[s] ?? 0}</p></Card>
        ))}
      </div>
      {/* filters */}
      <Card className="mt-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Search (order id)" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="order id" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-hansan-ink-muted">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-sm border border-hansan-line bg-hansan-surface-raised px-3 py-2 text-sm text-hansan-ink">
              <option value="">All</option>
              <option value="pending">pending</option>
              <option value="in_progress">in_progress</option>
              <option value="ready">ready</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
          <Input label="From date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <Input label="To date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={() => { setOffset(0); load(); }} className="w-full sm:w-auto">Apply</Button>
          <Button variant="secondary" onClick={() => { setSearch(""); setStatusFilter(""); setOutletFilter(""); setFromDate(""); setToDate(""); setOffset(0); }} className="w-full sm:w-auto">Clear</Button>
        </div>
      </Card>
      {/* list */}
      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-hansan-ink-muted">Loading orders…</p>
        ) : error ? (
          <div><p className="text-sm text-hansan-danger" role="alert">{error}</p><Button onClick={load} className="mt-3">Retry</Button></div>
        ) : orders.length === 0 ? (
          <EmptyState title="No orders" description="No orders match the current filters." />
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((o) => (
              <Card key={o.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">Order {o.id.slice(0, 8)}</CardTitle>
                  <Badge tone={o.status === "ready" ? "success" : o.status === "cancelled" ? "danger" : "orange"}>{o.status}</Badge>
                </div>
                <CardDescription className="mt-1">Outlet: {o.outletId} · Total: {Number(o.total).toLocaleString("id-ID")}</CardDescription>
                <p className="mt-1 text-xs text-hansan-ink-muted">Created {new Date(o.createdAt).toLocaleString()}</p>
                <div className="mt-3">
                  <Button variant="secondary" onClick={() => openDetail(o)} disabled={detailLoading}>View details</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* pagination */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>Previous</Button>
        <span className="text-xs text-hansan-ink-muted">{offset + 1}–{Math.min(offset + limit, total)} of {total}</span>
        <Button variant="secondary" disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)}>Next</Button>
      </div>

      {/* detail modal */}
      {selected && (
        <div className="fixed inset-0 z-dialog flex items-center justify-center bg-hansan-ink/40 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-sm border border-hansan-line bg-hansan-surface-raised p-6 shadow-neu-raised">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-hansan-ink">Order {selected.order.id.slice(0, 8)}</h2>
              <button onClick={() => setSelected(null)} className="rounded-xs px-2 py-1 text-xs font-semibold text-hansan-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-hansan-blue">Close</button>
            </div>
            <p className="mt-1 text-xs text-hansan-ink-muted">Status: {selected.order.status} · Total: {Number(selected.order.total).toLocaleString("id-ID")}</p>
            <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-hansan-ink-muted">Items</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {selected.items.map((it: any) => (
                <li key={it.id} className="rounded-sm border border-hansan-line bg-hansan-surface-soft px-3 py-2 text-sm">
                  <div className="flex justify-between"><span className="font-semibold text-hansan-ink">{it.name}</span><span className="font-mono">×{it.qty}</span></div>
                  <div className="mt-1 text-xs text-hansan-ink-muted">Station: {it.station} · {Number(it.price).toLocaleString("id-ID")} each</div>
                  {it.notes && <div className="mt-1 text-xs text-hansan-ink-muted">Notes: {it.notes}</div>}
                </li>
              ))}
            </ul>
            <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-hansan-ink-muted">Station progress</h3>
            <div className="mt-2 flex gap-3">
              {selected.tickets.map((t: any) => (
                <div key={t.id} className="flex-1 rounded-sm border border-hansan-line bg-hansan-surface-soft px-3 py-2 text-center">
                  <p className="text-xs font-semibold uppercase text-hansan-ink-muted">{t.station}</p>
                  <p className="mt-1 text-sm font-bold text-hansan-ink">{t.status}</p>
                </div>
              ))}
            </div>
            <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-hansan-ink-muted">Status history</h3>
            <ul className="mt-2 flex flex-col gap-1 text-xs text-hansan-ink-muted">
              {selected.history.map((h: any) => (
                <li key={h.id}>{h.fromStatus ?? "—"} → {h.toStatus} ({new Date(h.createdAt).toLocaleString()})</li>
              ))}
            </ul>
            {selected.order.status !== "cancelled" && selected.order.status !== "ready" && (
              <div className="mt-6 border-t border-hansan-line pt-4">
                {!cancelOpen ? (
                  <Button variant="secondary" onClick={() => setCancelOpen(true)}>Cancel order</Button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Input label="Cancellation reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason" />
                    {cancelError && <Alert variant="danger">{cancelError}</Alert>}
                    <div className="flex gap-2">
                      <Button onClick={handleCancel} loading={canceling} className="w-full">Confirm cancel</Button>
                      <Button variant="secondary" onClick={() => { setCancelOpen(false); setCancelReason(""); setCancelError(null); }} className="w-full">Abort</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
