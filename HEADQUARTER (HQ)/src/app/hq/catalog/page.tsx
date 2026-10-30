"use client";
import * as React from "react";
import { PageHeader, Card, CardTitle, CardDescription, EmptyState, Badge, Button, Input, Alert } from "@/components/ui";

interface Category { id: string; name: string; slug: string; displayOrder: string; active: string; organizationId: string; }
interface MenuItem { id: string; name: string; sku: string | null; description: string | null; basePrice: string; station: string; active: string; categoryId: string | null; organizationId: string; }

export default function HqCatalogPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [items, setItems] = React.useState<MenuItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [catName, setCatName] = React.useState("");
  const [catSlug, setCatSlug] = React.useState("");
  const [itemName, setItemName] = React.useState("");
  const [itemPrice, setItemPrice] = React.useState("");
  const [itemStation, setItemStation] = React.useState("kitchen");
  const [itemCategory, setItemCategory] = React.useState("");
  const [itemSku, setItemSku] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [cRes, iRes] = await Promise.all([
        fetch("/api/catalog/categories?orgSlug=demo"),
        fetch("/api/catalog/items?orgSlug=demo"),
      ]);
      const cj = await cRes.json();
      const ij = await iRes.json();
      if (!cRes.ok || !cj?.ok) throw new Error("Failed to load categories");
      if (!iRes.ok || !ij?.ok) throw new Error("Failed to load items");
      setCategories(cj.categories ?? []);
      setItems(ij.items ?? []);
    } catch {
      setError("Failed to load catalog. Retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function toggleCategory(c: Category) {
    await fetch(`/api/catalog/categories/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: c.active !== "true" }) });
    load();
  }
  async function toggleItem(it: MenuItem) {
    await fetch(`/api/catalog/items/${it.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: it.active !== "true" }) });
    load();
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setFormError(null);
    try {
      const orgId = categories[0]?.organizationId ?? (await (async () => {
        const r = await fetch("/api/outlets?orgSlug=demo"); const j = await r.json(); return j.outlets?.[0]?.organizationId;
      })());
      const res = await fetch("/api/catalog/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId: orgId, name: catName, slug: catSlug || undefined }) });
      const json = await res.json();
      if (!res.ok || !json?.ok) { setFormError(json?.error?.message ?? "Create failed"); return; }
      setCatName(""); setCatSlug(""); load();
    } catch { setFormError("Network error"); }
    finally { setSaving(false); }
  }

  async function createItem(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setFormError(null);
    try {
      const orgId = items[0]?.organizationId ?? categories[0]?.organizationId ?? (await (async () => {
        const r = await fetch("/api/outlets?orgSlug=demo"); const j = await r.json(); return j.outlets?.[0]?.organizationId;
      })());
      const res = await fetch("/api/catalog/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId: orgId, categoryId: itemCategory || null, name: itemName, sku: itemSku || null, basePrice: Number(itemPrice), station: itemStation }) });
      const json = await res.json();
      if (!res.ok || !json?.ok) { setFormError(json?.error?.message ?? "Create failed"); return; }
      setItemName(""); setItemPrice(""); setItemSku(""); load();
    } catch { setFormError("Network error"); }
    finally { setSaving(false); }
  }

  return (
    <>
      <PageHeader eyebrow="Headquarter" title="Catalog" description="Manage categories and menu items." />
      {loading ? (
        <p className="mt-6 text-sm text-hansan-ink-muted">Loading catalog…</p>
      ) : error ? (
        <div className="mt-6"><p className="text-sm text-hansan-danger" role="alert">{error}</p><Button onClick={load} className="mt-3">Retry</Button></div>
      ) : (
        <>
          <Card className="mt-6">
            <CardTitle>Create category</CardTitle>
            <form onSubmit={createCategory} className="mt-3 flex flex-wrap items-end gap-3">
              <Input label="Name" value={catName} onChange={(e) => setCatName(e.target.value)} required />
              <Input label="Slug" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} placeholder="auto" />
              {formError && <Alert variant="danger">{formError}</Alert>}
              <Button type="submit" loading={saving}>Create category</Button>
            </form>
          </Card>

          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-hansan-ink-muted">Categories</h2>
            <div className="mt-3 flex flex-col gap-2">
              {categories.length === 0 ? <EmptyState title="No categories" description="Create a category to get started." /> : categories.map((c) => (
                <Card key={c.id}>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    <Badge tone={c.active === "true" ? "success" : "muted"}>{c.active === "true" ? "active" : "inactive"}</Badge>
                  </div>
                  <CardDescription className="mt-1">slug: {c.slug} · order: {c.displayOrder}</CardDescription>
                  <div className="mt-2">
                    <Button variant="secondary" onClick={() => toggleCategory(c)}>{c.active === "true" ? "Deactivate" : "Activate"}</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Card className="mt-6">
            <CardTitle>Create menu item</CardTitle>
            <form onSubmit={createItem} className="mt-3 flex flex-col gap-3">
              <Input label="Name" value={itemName} onChange={(e) => setItemName(e.target.value)} required />
              <Input label="SKU" value={itemSku} onChange={(e) => setItemSku(e.target.value)} />
              <Input label="Base price" type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} required />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-hansan-ink-muted">Station</label>
                <select value={itemStation} onChange={(e) => setItemStation(e.target.value)} className="w-full rounded-sm border border-hansan-line bg-hansan-surface-raised px-3 py-2 text-sm text-hansan-ink">
                  <option value="kitchen">kitchen</option>
                  <option value="bar">bar</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-hansan-ink-muted">Category</label>
                <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className="w-full rounded-sm border border-hansan-line bg-hansan-surface-raised px-3 py-2 text-sm text-hansan-ink">
                  <option value="">None</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {formError && <Alert variant="danger">{formError}</Alert>}
              <Button type="submit" loading={saving}>Create item</Button>
            </form>
          </Card>

          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-hansan-ink-muted">Menu items</h2>
            <div className="mt-3 flex flex-col gap-2">
              {items.length === 0 ? <EmptyState title="No items" description="Create a menu item to get started." /> : items.map((it) => (
                <Card key={it.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">{it.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge tone={it.station === "bar" ? "blue" : "orange"}>{it.station}</Badge>
                      <Badge tone={it.active === "true" ? "success" : "muted"}>{it.active === "true" ? "active" : "inactive"}</Badge>
                    </div>
                  </div>
                  <CardDescription className="mt-1">{it.sku ? `SKU: ${it.sku} · ` : ""}Price: {Number(it.basePrice).toLocaleString("id-ID")}</CardDescription>
                  <div className="mt-2">
                    <Button variant="secondary" onClick={() => toggleItem(it)}>{it.active === "true" ? "Deactivate" : "Activate"}</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

