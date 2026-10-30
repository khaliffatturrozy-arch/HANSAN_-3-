"use client";
import * as React from "react";
import { PageHeader, Card, CardTitle, Badge, Button, EmptyState } from "@/components/ui";

type TicketStatus = "new" | "preparing" | "ready";
interface TicketItem { name: string; qty: number; }
interface Ticket { id: string; orderNo: string; items: TicketItem[]; receivedAt: string; status: TicketStatus; }

export default function KitchenKdsPage() {
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<"all" | TicketStatus>("all");
  const [connection, setConnection] = React.useState<"connecting" | "live" | "polling">("connecting");

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/kds?station=kitchen");
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error("Failed to load tickets");
      const mapped: Ticket[] = (json.tickets ?? []).map((t: any) => ({
        id: t.ticket.id,
        orderNo: t.order ? `#${t.order.id.slice(0, 6)}` : t.ticket.id.slice(0, 6),
        items: (t.items ?? []).map((i: any) => ({ name: i.name, qty: Number(i.qty) })),
        receivedAt: new Date(t.ticket.createdAt).toLocaleTimeString(),
        status: t.ticket.status as TicketStatus,
      }));
      setTickets(mapped);
    } catch {
      setError("Failed to load kitchen tickets. Retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    let es: EventSource | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    const startPolling = () => {
      if (pollId) return;
      setConnection("polling");
      pollId = setInterval(() => { if (!cancelled) load(); }, 10000);
    };
    const stopPolling = () => { if (pollId) { clearInterval(pollId); pollId = null; } };
    try {
      es = new EventSource("/api/events?orgSlug=demo&station=kitchen");
      es.onopen = () => { setConnection("live"); stopPolling(); };
      es.onmessage = () => { if (!cancelled) load(); };
      es.onerror = () => { setConnection("polling"); es?.close(); es = null; startPolling(); };
    } catch {
      startPolling();
    }
    // initial fallback timer in case SSE never opens
    const fallbackTimer = setTimeout(() => { if (connection === "connecting") startPolling(); }, 4000);
    return () => { cancelled = true; if (es) es.close(); if (pollId) clearInterval(pollId); clearTimeout(fallbackTimer); };
  }, [load, connection]);

  const visible = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  async function advance(id: string, current: TicketStatus) {
    const next = current === "new" ? "preparing" : current === "preparing" ? "ready" : current;
    if (next === current) return;
    try {
      const res = await fetch(`/api/kds/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
      if (!res.ok) throw new Error("update failed");
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: next } : t)));
    } catch {
      // keep local state unchanged on failure
    }
  }

  return (
    <>
      <PageHeader eyebrow="Kitchen" title="Kitchen KDS" description="Tickets from the shared order system." />
      <p className="mt-2 text-xs text-hansan-ink-muted">Connection: {connection === "live" ? "Connected (realtime)" : connection === "polling" ? "Polling fallback" : "Connecting…"}</p>
      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Ticket filter">
        {(["all", "new", "preparing", "ready"] as const).map((f) => (
          <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={["rounded-sm border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition", filter === f ? "border-hansan-ink bg-hansan-orange text-white" : "border-hansan-line bg-hansan-surface-raised text-hansan-ink hover:border-hansan-line-strong"].join(" ")}>{f}</button>
        ))}
      </div>
      {loading ? (
        <p className="mt-6 text-sm text-hansan-ink-muted">Loading tickets…</p>
      ) : error ? (
        <div className="mt-6"><p className="text-sm text-hansan-danger" role="alert">{error}</p><Button onClick={load} className="mt-3">Retry</Button></div>
      ) : visible.length === 0 ? (
        <EmptyState title="No tickets" description="No tickets in this status." className="mt-6" />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => (
            <Card key={t.id} raised={t.status === "new"}>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">{t.orderNo}</CardTitle>
                <Badge tone={t.status === "ready" ? "success" : t.status === "preparing" ? "blue" : "orange"}>{t.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-hansan-ink-muted">Received {t.receivedAt}</p>
              <ul className="mt-3 flex flex-col gap-1">
                {t.items.map((it, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-hansan-ink">{it.name}</span>
                    <span className="font-mono font-bold text-hansan-ink">×{it.qty}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                {t.status === "new" && <Button onClick={() => advance(t.id, t.status)} className="w-full">Start preparing</Button>}
                {t.status === "preparing" && <Button onClick={() => advance(t.id, t.status)} className="w-full">Mark ready</Button>}
                {t.status === "ready" && <p className="text-center text-xs font-semibold text-hansan-success">Ready for pickup</p>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-hansan-ink-muted">Tickets from the shared order system. Real-time updates require backend integration.</p>
    </>
  );
}



