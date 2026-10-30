"use client";
import * as React from "react";
import { addItem, updateQty, removeItem, computeTotals, type CartItem } from "@/domain/pos/cart";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { POSShell } from "@/components/shell/POSShell";

interface CatalogItem { item: { id: string; name: string; basePrice: string; station: "kitchen" | "bar"; active: string; }; effectivePrice: number; available: boolean; }

function idempotencyKey() { return `pos_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`; }

export default function PosHomePage() {
  const [catalog, setCatalog] = React.useState<CatalogItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [catalogError, setCatalogError] = React.useState<string | null>(null);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<{ orderId: string; duplicate: boolean } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [key, setKey] = React.useState<string>(() => idempotencyKey());
  const totals = computeTotals(cart, 0);

  const loadCatalog = React.useCallback(async () => {
    setLoading(true); setCatalogError(null);
    try {
      const res = await fetch("/api/catalog/outlet?orgSlug=demo&outletId=" + "");
      // outletId unknown; resolve via first outlet
      let outletId = "";
      try {
        const oRes = await fetch("/api/outlets?orgSlug=demo");
        const oJson = await oRes.json();
        if (oJson?.ok && oJson.outlets?.[0]) outletId = oJson.outlets[0].id;
      } catch {}
      const r2 = await fetch(`/api/catalog/outlet?orgSlug=demo&outletId=${outletId}`);
      const j = await r2.json();
      if (!r2.ok || !j?.ok) throw new Error("Failed to load catalog");
      setCatalog(j.catalog ?? []);
    } catch {
      setCatalogError("Failed to load catalog. Retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadCatalog(); }, [loadCatalog]);

  async function checkout() {
    if (cart.length === 0) return;
    setSubmitting(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines: cart.map((c) => ({ itemId: c.itemId, name: c.name, price: c.price, qty: c.qty, station: (c as any).station ?? "kitchen", notes: null })), idempotencyKey: key, taxPercent: 0, orgSlug: "demo", outletSlug: "main" }) });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        const code = json?.error?.code;
        if (code === "OUTLET_CLOSED") setError("Outlet sedang berada di luar jam operasional. Order baru belum dapat dibuat.");
        else if (code === "OUTLET_NOT_ACCEPTING_ORDERS") setError("Outlet sedang tidak menerima order baru.");
        else if (code === "STATION_INACTIVE") setError("Station yang diperlukan untuk order ini sedang tidak aktif. Hubungi Manager atau Admin.");
        else setError(json?.error?.message ?? "Failed to create order.");
        return;
      }
      setResult({ orderId: json.order.id, duplicate: json.duplicate });
      setCart([]); setKey(idempotencyKey());
    } catch { setError("Network error. Please retry."); }
    finally { setSubmitting(false); }
  }

  const availableItems = catalog.filter((c) => c.available);

  return (
    <POSShell>
      <header className="mb-6 flex items-end justify-between gap-3 border-b border-hansan-line pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-hansan-ink-muted">Point of Sale</p>
          <h1 className="text-3xl font-black tracking-tight">Order</h1>
        </div>
        <Badge tone="muted">Catalog</Badge>
      </header>
      {loading ? (
        <p className="text-sm text-hansan-ink-muted">Loading catalog…</p>
      ) : catalogError ? (
        <div><p className="text-sm text-hansan-danger" role="alert">{catalogError}</p><Button onClick={loadCatalog} className="mt-3">Retry</Button></div>
      ) : availableItems.length === 0 ? (
        <EmptyState title="No items" description="No available menu items for this outlet." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-hansan-ink-muted">Menu</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {availableItems.map((c) => (
                <Card key={c.item.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-hansan-ink">{c.item.name}</p>
                      <p className="mt-1 text-xs text-hansan-ink-muted">Station: {c.item.station}</p>
                    </div>
                    <Badge tone={c.item.station === "bar" ? "blue" : "orange"}>{c.item.station}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-hansan-ink">{c.effectivePrice.toLocaleString("id-ID")}</span>
                    <Button onClick={() => setCart((cur) => addItem(cur, { id: c.item.id, name: c.item.name, price: c.effectivePrice, station: c.item.station }))}>Add</Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Card raised>
              <CardTitle>Cart</CardTitle>
              {cart.length === 0 ? (
                <EmptyState title="Cart is empty" description="Add items from the menu." className="mt-3" />
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {cart.map((c) => (
                    <li key={c.itemId} className="flex items-center justify-between gap-2 rounded-sm border border-hansan-line bg-hansan-surface-soft px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-hansan-ink">{c.name}</p>
                        <p className="font-mono text-xs text-hansan-ink-muted">{c.price.toLocaleString("id-ID")} × {c.qty}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setCart((cur) => updateQty(cur, c.itemId, c.qty - 1))} className="h-7 w-7 rounded-xs border border-hansan-line bg-hansan-surface-raised text-sm font-bold hover:bg-hansan-surface-sunken" aria-label="Decrease">−</button>
                        <button type="button" onClick={() => setCart((cur) => updateQty(cur, c.itemId, c.qty + 1))} className="h-7 w-7 rounded-xs border border-hansan-line bg-hansan-surface-raised text-sm font-bold hover:bg-hansan-surface-sunken" aria-label="Increase">+</button>
                        <button type="button" onClick={() => setCart((cur) => removeItem(cur, c.itemId))} className="h-7 w-7 rounded-xs border border-hansan-danger/40 bg-hansan-danger/5 text-xs font-bold text-hansan-danger hover:bg-hansan-danger/10" aria-label="Remove">×</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 border-t border-hansan-line pt-3 text-sm">
                <div className="flex justify-between"><span className="text-hansan-ink-muted">Items</span><span className="font-mono">{totals.itemCount}</span></div>
                <div className="flex justify-between"><span className="text-hansan-ink-muted">Subtotal</span><span className="font-mono">{totals.subtotal.toLocaleString("id-ID")}</span></div>
                <div className="flex justify-between font-bold"><span>Total</span><span className="font-mono">{totals.total.toLocaleString("id-ID")}</span></div>
              </div>
              {error && <p className="mt-3 text-xs font-medium text-hansan-danger" role="alert">{error}</p>}
              {result && (
                <div className="mt-3 rounded-sm border border-hansan-success/40 bg-hansan-success/5 px-3 py-2 text-xs text-hansan-success">
                  Order {result.orderId} {result.duplicate ? "(duplicate prevented)" : "created"}.
                </div>
              )}
              <div className="mt-4 flex flex-col gap-2">
                <Button onClick={checkout} loading={submitting} disabled={cart.length === 0} className="w-full">
                  {submitting ? "Creating…" : "Create order"}
                </Button>
              </div>
            </Card>
          </aside>
        </div>
      )}
    </POSShell>
  );
}
