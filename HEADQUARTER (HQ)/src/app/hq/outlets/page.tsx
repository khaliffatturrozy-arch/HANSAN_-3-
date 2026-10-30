"use client";
import * as React from "react";
import { PageHeader, Card, CardTitle, CardDescription, EmptyState, Badge, Button, Input, Alert } from "@/components/ui";

interface Outlet { id: string; name: string; code: string; slug: string; status: string; address: string | null; contactEmail: string | null; contactPhone: string | null; organizationId: string; createdAt: string; }

export default function HqOutletsPage() {
  const [outlets, setOutlets] = React.useState<Outlet[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [showCreate, setShowCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<Outlet | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deactivating, setDeactivating] = React.useState<Outlet | null>(null);

  const [form, setForm] = React.useState({ name: "", code: "", slug: "", address: "", contactEmail: "", contactPhone: "", status: "active" });

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/outlets?orgSlug=demo");
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error("Failed to load outlets");
      setOutlets(json.outlets ?? []);
    } catch {
      setError("Failed to load outlets. Retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const filtered = outlets.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (search && !o.name.toLowerCase().includes(search.toLowerCase()) && !o.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = { total: outlets.length, active: outlets.filter((o) => o.status === "active").length, inactive: outlets.filter((o) => o.status === "inactive").length };

  function resetForm() {
    setForm({ name: "", code: "", slug: "", address: "", contactEmail: "", contactPhone: "", status: "active" });
    setFormError(null);
  }

  function openCreate() { resetForm(); setShowCreate(true); setEditing(null); }
  function openEdit(o: Outlet) {
    setForm({ name: o.name, code: o.code, slug: o.slug, address: o.address ?? "", contactEmail: o.contactEmail ?? "", contactPhone: o.contactPhone ?? "", status: o.status });
    setEditing(o); setShowCreate(false); setFormError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setFormError(null);
    try {
      const res = await fetch("/api/outlets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId: outlets[0]?.organizationId, name: form.name, code: form.code, slug: form.slug || undefined, address: form.address || null, contactEmail: form.contactEmail || null, contactPhone: form.contactPhone || null }) });
      const json = await res.json();
      if (!res.ok || !json?.ok) { setFormError(json?.error?.message ?? "Create failed"); return; }
      setShowCreate(false); resetForm(); load();
    } catch { setFormError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true); setFormError(null);
    try {
      const res = await fetch(`/api/outlets/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, code: form.code, slug: form.slug || undefined, address: form.address || null, contactEmail: form.contactEmail || null, contactPhone: form.contactPhone || null, status: form.status }) });
      const json = await res.json();
      if (!res.ok || !json?.ok) { setFormError(json?.error?.message ?? "Update failed"); return; }
      setEditing(null); resetForm(); load();
    } catch { setFormError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleDeactivate() {
    if (!deactivating) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/outlets/${deactivating.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "inactive" }) });
      const json = await res.json();
      if (!res.ok || !json?.ok) { return; }
      setDeactivating(null); load();
    } finally { setSaving(false); }
  }

  async function handleReactivate(o: Outlet) {
    await fetch(`/api/outlets/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "active" }) });
    load();
  }

  return (
    <>
      <PageHeader eyebrow="Headquarter" title="Outlets" description="Manage outlets under your organization." />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card><CardTitle className="text-sm">Total</CardTitle><p className="mt-1 text-2xl font-black text-hansan-ink">{counts.total}</p></Card>
        <Card><CardTitle className="text-sm">Active</CardTitle><p className="mt-1 text-2xl font-black text-hansan-success">{counts.active}</p></Card>
        <Card><CardTitle className="text-sm">Inactive</CardTitle><p className="mt-1 text-2xl font-black text-hansan-ink-muted">{counts.inactive}</p></Card>
      </div>
      <Card className="mt-6">
        <div className="flex flex-wrap items-end gap-3">
          <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="name or code" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-hansan-ink-muted">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-sm border border-hansan-line bg-hansan-surface-raised px-3 py-2 text-sm text-hansan-ink">
              <option value="">All</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </div>
          <Button onClick={openCreate} className="w-full sm:w-auto">Create outlet</Button>
        </div>
      </Card>

      {showCreate && (
        <Card className="mt-6">
          <CardTitle>Create outlet</CardTitle>
          <form onSubmit={handleCreate} className="mt-3 flex flex-col gap-3">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="MAIN" />
            <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="main" />
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input label="Contact email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            <Input label="Contact phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            {formError && <Alert variant="danger">{formError}</Alert>}
            <div className="flex gap-2">
              <Button type="submit" loading={saving} className="w-full">Create</Button>
              <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); resetForm(); }} className="w-full">Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {editing && (
        <Card className="mt-6">
          <CardTitle>Edit outlet</CardTitle>
          <form onSubmit={handleUpdate} className="mt-3 flex flex-col gap-3">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input label="Contact email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            <Input label="Contact phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-hansan-ink-muted">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-sm border border-hansan-line bg-hansan-surface-raised px-3 py-2 text-sm text-hansan-ink">
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
            {formError && <Alert variant="danger">{formError}</Alert>}
            <div className="flex gap-2">
              <Button type="submit" loading={saving} className="w-full">Save</Button>
              <Button type="button" variant="secondary" onClick={() => { setEditing(null); resetForm(); }} className="w-full">Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-hansan-ink-muted">Loading outlets…</p>
        ) : error ? (
          <div><p className="text-sm text-hansan-danger" role="alert">{error}</p><Button onClick={load} className="mt-3">Retry</Button></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No outlets" description="No outlets match the current filter." />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((o) => (
              <Card key={o.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{o.name}</CardTitle>
                  <Badge tone={o.status === "active" ? "success" : "muted"}>{o.status}</Badge>
                </div>
                <CardDescription className="mt-1">Code: {o.code} · Slug: {o.slug}</CardDescription>
                {o.address && <p className="mt-1 text-xs text-hansan-ink-muted">{o.address}</p>}
                {o.contactEmail && <p className="mt-1 text-xs text-hansan-ink-muted">{o.contactEmail}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => openEdit(o)}>Edit</Button>
                  <a href={`/hq/outlets/${o.id}/settings`} className="inline-flex items-center justify-center rounded-sm border border-hansan-line bg-hansan-surface-raised px-3 py-2 text-xs font-semibold text-hansan-ink transition hover:border-hansan-line-strong">Settings</a>
                  {o.status === "active" ? (
                    <Button variant="secondary" onClick={() => setDeactivating(o)}>Deactivate</Button>
                  ) : (
                    <Button onClick={() => handleReactivate(o)}>Reactivate</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {deactivating && (
        <div className="fixed inset-0 z-dialog flex items-center justify-center bg-hansan-ink/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-sm border border-hansan-line bg-hansan-surface-raised p-6 shadow-neu-raised">
            <h2 className="text-lg font-black text-hansan-ink">Deactivate outlet?</h2>
            <p className="mt-2 text-sm text-hansan-ink-muted">{deactivating.name} will be marked inactive. Historical orders remain readable. Deactivated outlets cannot receive new orders unless reactivated.</p>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleDeactivate} loading={saving} className="w-full">Confirm</Button>
              <Button variant="secondary" onClick={() => setDeactivating(null)} className="w-full">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

