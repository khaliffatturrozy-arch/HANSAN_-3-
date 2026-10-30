"use client";
import * as React from "react";
import { PageHeader, Card, CardTitle, CardDescription, EmptyState, Badge, Button, Input, Alert } from "@/components/ui";

interface Outlet { id: string; name: string; organizationId: string; }
interface CatalogEntry { item: { id: string; name: string; basePrice: string; station: string; active: string; }; effectivePrice: number; available: boolean; config: { id: string; priceOverride: string | null; available: string; active: string } | null; }

export default function OutletCatalogConfigPage() {
  const [outlets, setOutlets] = React.useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = React.useState<string>("");
  const [catalog, setCatalog] = React.useState<CatalogEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState<string | null>(null);

  const loadOutlets = React.useCallback(async () => {
    try {
      const res = await fetch("/api/outlets?orgSlug=demo");
      const json = await res.json();
      if (res.ok && json?.ok) {
        setOutlets(json.outlets ?? []);
        if (!selectedOutlet && json.outlets?.[0]) setSelectedOutlet(json.outlets[0].id);
      }
    } catch {}
  }, [selectedOutlet]);

  const loadCatalog = React.useCallback(async () => {
    if (!selectedOutlet) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/catalog/outlet?orgSlug=demo&outletId=${selectedOutlet}`);
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error("Failed to load catalog");
      setCatalog(json.catalog ?? []);
    } catch {
      setError("Failed to load catalog. Retry.");
    } finally {
      setLoading(false);
    }
  }, [selectedOutlet]);

  React.useEffect(() => { loadOutlets(); }, [loadOutlets]);
  React.useEffect(() => { loadCatalog(); }, [loadCatalog]);

  async function updateConfig(item: CatalogEntry, patch: { priceOverride?: number | null; available?: boolean; active?: boolean }) {
    setSaving(item.item.id);
    try {
      const res = await fetch("/api/catalog/outlet-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ outletId: selectedOutlet, menuItemId: item.item.id, priceOverride: patch.priceOverride ?? (item.config?.priceOverride ? Number(item.config.priceOverride) : null), available: patch.available ?? (item.config?.available === "true"), active: patch.active ?? (item.config?.active === "true") }) });
      const json = await res.json();
      if (res.ok && json?.ok) loadCatalog();
    } finally {
      setSaving(null);
    }
  }

  async function clearOverride(item: CatalogEntry) {
    setSaving(item.item.id);
    try {
      const res = await fetch("/api/catalog/outlet-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ outletId: selectedOutlet, menuItemId: item.item.id, priceOverride: null, available: item.config?.available === "true", active: item.config?.active === "true" }) });
      const json = await res.json();
      if (res.ok && json?.ok) loadCatalog();
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Headquarter" title="Outlet catalog configuration" description="Configure outlet-specific prices and availability." />
      <Card className="mt-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-hansan-ink-muted">Outlet</label>
            <select value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)} className="w-full rounded-sm border border-hansan-line bg-hansan-surface-raised px-3 py-2 text-sm text-hansan-ink">
              {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <p className="mt-6 text-sm text-hansan-ink-muted">Loading catalog…</p>
      ) : error ? (
        <div className="mt-6"><p className="text-sm text-hansan-danger" role="alert">{error}</p><Button onClick={loadCatalog} className="mt-3">Retry</Button></div>
      ) : catalog.length === 0 ? (
        <EmptyState title="No items" description="No catalog items for this outlet." className="mt-6" />
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {catalog.map((entry) => (
            <Card key={entry.item.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{entry.item.name}</CardTitle>
                <Badge tone={entry.item.station === "bar" ? "blue" : "orange"}>{entry.item.station}</Badge>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div><p className="text-xs text-hansan-ink-muted">Base price</p><p className="font-mono font-bold">{Number(entry.item.basePrice).toLocaleString("id-ID")}</p></div>
                <div><p className="text-xs text-hansan-ink-muted">Effective</p><p className="font-mono font-bold">{entry.effectivePrice.toLocaleString("id-ID")}</p></div>
                <div><p className="text-xs text-hansan-ink-muted">Override</p><p className="font-mono">{entry.config?.priceOverride ?? "—"}</p></div>
                <div><p className="text-xs text-hansan-ink-muted">Available</p><p className="font-mono">{entry.available ? "yes" : "no"}</p></div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-hansan-ink"><input type="checkbox" checked={entry.config?.active === "true"} onChange={(e) => updateConfig(entry, { active: e.target.checked })} disabled={saving === entry.item.id} /> Active for outlet</label>
                <label className="flex items-center gap-2 text-xs text-hansan-ink"><input type="checkbox" checked={entry.available} onChange={(e) => updateConfig(entry, { available: e.target.checked })} disabled={saving === entry.item.id} /> Available</label>
                <div className="flex items-center gap-2">
                  <input type="number" min="0" placeholder="override price" className="w-28 rounded-sm border border-hansan-line bg-hansan-surface-raised px-2 py-1 text-xs text-hansan-ink" id={`price-${entry.item.id}`} />
                  <button onClick={() => {
                    const input = document.getElementById(`price-${entry.item.id}`) as HTMLInputElement | null;
                    const v = input?.value ?? "";
                    if (v === "") clearOverride(entry);
                    else { const n = Number(v); if (!isNaN(n) && n >= 0) updateConfig(entry, { priceOverride: n }); }
                  }} className="rounded-xs px-2 py-1 text-xs font-semibold text-hansan-blue hover:bg-hansan-surface-sunken" disabled={saving === entry.item.id}>Set price</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

