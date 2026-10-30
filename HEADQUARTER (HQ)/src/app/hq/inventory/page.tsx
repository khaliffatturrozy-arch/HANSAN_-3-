"use client";
import * as React from "react";
import { PageHeader, Card, CardTitle, CardDescription, EmptyState, Badge, Button, Input, Alert } from "@/components/ui";

interface Material { id: string; name: string; sku: string | null; category: string | null; baseUnit: string; minStock: string; active: string; organizationId: string; }

export default function HqInventoryPage() {
  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [unit, setUnit] = React.useState("g");
  const [category, setCategory] = React.useState("");
  const [minStock, setMinStock] = React.useState("0");
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/inventory/materials?orgSlug=demo");
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error("Failed to load materials");
      setMaterials(json.materials ?? []);
    } catch {
      setError("Failed to load materials. Retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function createMaterial(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setFormError(null);
    try {
      const orgId = materials[0]?.organizationId ?? (await (async () => { const r = await fetch("/api/outlets?orgSlug=demo"); const j = await r.json(); return j.outlets?.[0]?.organizationId; })());
      const res = await fetch("/api/inventory/materials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId: orgId, name, baseUnit: unit, category: category || null, minStock: Number(minStock) }) });
      const json = await res.json();
      if (!res.ok || !json?.ok) { setFormError(json?.error?.message ?? "Create failed"); return; }
      setName(""); setCategory(""); setMinStock("0"); load();
    } catch { setFormError("Network error"); }
    finally { setSaving(false); }
  }

  return (
    <>
      <PageHeader eyebrow="Headquarter" title="Inventory" description="Manage raw materials and stock." />
      <Card className="mt-6">
        <CardTitle>Create material</CardTitle>
        <form onSubmit={createMaterial} className="mt-3 flex flex-col gap-3">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-hansan-ink-muted">Base unit</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full rounded-sm border border-hansan-line bg-hansan-surface-raised px-3 py-2 text-sm text-hansan-ink">
              <option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="l">l</option><option value="pcs">pcs</option><option value="pack">pack</option>
            </select>
          </div>
          <Input label="Min stock" type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Button type="submit" loading={saving}>Create material</Button>
        </form>
      </Card>
      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-hansan-ink-muted">Loading materials…</p>
        ) : error ? (
          <div><p className="text-sm text-hansan-danger" role="alert">{error}</p><Button onClick={load} className="mt-3">Retry</Button></div>
        ) : materials.length === 0 ? (
          <EmptyState title="No materials" description="Create a material to get started." />
        ) : (
          <div className="flex flex-col gap-2">
            {materials.map((m) => (
              <Card key={m.id}>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{m.name}</CardTitle>
                  <Badge tone={m.active === "true" ? "success" : "muted"}>{m.active === "true" ? "active" : "inactive"}</Badge>
                </div>
                <CardDescription className="mt-1">{m.category ?? "—"} · {m.baseUnit} · min {m.minStock}</CardDescription>
                {m.sku && <p className="mt-1 text-xs text-hansan-ink-muted">SKU: {m.sku}</p>}
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
