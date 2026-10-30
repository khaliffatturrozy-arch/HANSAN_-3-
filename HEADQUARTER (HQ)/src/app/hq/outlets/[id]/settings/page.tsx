"use client";
import * as React from "react";
import { useParams } from "next/navigation";
import { PageHeader, Card, CardTitle, Button, Input, Alert } from "@/components/ui";

export default function OutletSettingsPage() {
  const params = useParams();
  const id = params.id as string;
  const [settings, setSettings] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [form, setForm] = React.useState({
    timezone: "Asia/Jakarta",
    kitchenActive: true,
    barActive: true,
    kitchenName: "Kitchen",
    barName: "Bar",
    kitchenDisplayOrder: 0,
    barDisplayOrder: 1,
    acceptOrders: true,
    businessHours: null as any,
  });

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/outlets/${id}/settings`);
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error("Failed to load settings");
      setSettings(json.settings);
      setForm({
        timezone: json.settings.timezone,
        kitchenActive: json.settings.kitchenActive,
        barActive: json.settings.barActive,
        kitchenName: json.settings.kitchenName,
        barName: json.settings.barName,
        kitchenDisplayOrder: json.settings.kitchenDisplayOrder,
        barDisplayOrder: json.settings.barDisplayOrder,
        acceptOrders: json.settings.acceptOrders,
        businessHours: json.settings.businessHours,
      });
    } catch { setError("Failed to load settings. Retry."); }
    finally { setLoading(false); }
  }, [id]);

  React.useEffect(() => { load(); }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setSuccess(false);
    try {
      const res = await fetch(`/api/outlets/${id}/settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok || !json?.ok) { setError(json?.error?.message ?? "Save failed"); return; }
      setSettings(json.settings); setSuccess(true);
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  return (
    <>
      <PageHeader eyebrow="Headquarter" title="Outlet settings" description="Configure outlet operational behavior." />
      {loading ? (
        <p className="mt-6 text-sm text-hansan-ink-muted">Loading settings…</p>
      ) : error ? (
        <div className="mt-6"><p className="text-sm text-hansan-danger" role="alert">{error}</p><Button onClick={load} className="mt-3">Retry</Button></div>
      ) : (
        <form onSubmit={handleSave} className="mt-6 flex flex-col gap-6">
          <Card>
            <CardTitle>General</CardTitle>
            <div className="mt-3 flex flex-col gap-3">
              <Input label="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} placeholder="Asia/Jakarta" />
              <label className="flex items-center gap-2 text-sm text-hansan-ink"><input type="checkbox" checked={form.acceptOrders} onChange={(e) => setForm({ ...form, acceptOrders: e.target.checked })} /> Accept new orders</label>
            </div>
          </Card>
          <Card>
            <CardTitle>Kitchen station</CardTitle>
            <div className="mt-3 flex flex-col gap-3">
              <Input label="Display name" value={form.kitchenName} onChange={(e) => setForm({ ...form, kitchenName: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-hansan-ink"><input type="checkbox" checked={form.kitchenActive} onChange={(e) => setForm({ ...form, kitchenActive: e.target.checked })} /> Active</label>
              <Input label="Display order" type="number" value={form.kitchenDisplayOrder} onChange={(e) => setForm({ ...form, kitchenDisplayOrder: Number(e.target.value) })} />
            </div>
          </Card>
          <Card>
            <CardTitle>Bar station</CardTitle>
            <div className="mt-3 flex flex-col gap-3">
              <Input label="Display name" value={form.barName} onChange={(e) => setForm({ ...form, barName: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-hansan-ink"><input type="checkbox" checked={form.barActive} onChange={(e) => setForm({ ...form, barActive: e.target.checked })} /> Active</label>
              <Input label="Display order" type="number" value={form.barDisplayOrder} onChange={(e) => setForm({ ...form, barDisplayOrder: Number(e.target.value) })} />
            </div>
          </Card>
          {success && <Alert variant="success">Settings saved.</Alert>}
          <Button type="submit" loading={saving} className="w-full">Save settings</Button>
        </form>
      )}
    </>
  );
}

