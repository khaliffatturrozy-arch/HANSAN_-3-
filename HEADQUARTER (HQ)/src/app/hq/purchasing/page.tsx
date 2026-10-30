"use client";
import * as React from "react";
import { PageHeader, Card, CardTitle, CardDescription, EmptyState, Badge, Button, Input, Alert } from "@/components/ui";

export default function HqPurchasingPage() {
  const [suppliers, setSuppliers] = React.useState<any[]>([]);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [supplierName, setSupplierName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [sRes, oRes] = await Promise.all([
        fetch("/api/suppliers?orgSlug=demo"),
        fetch("/api/purchase-orders?orgSlug=demo"),
      ]);
      const sj = await sRes.json();
      const oj = await oRes.json();
      if (sRes.ok && sj?.ok) setSuppliers(sj.suppliers ?? []);
      if (oRes.ok && oj?.ok) setOrders(oj.orders ?? []);
    } catch {
      setError("Failed to load purchasing data. Retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function createSupplier(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const orgId = suppliers[0]?.organizationId ?? (await (async () => { const r = await fetch("/api/outlets?orgSlug=demo"); const j = await r.json(); return j.outlets?.[0]?.organizationId; })());
      const res = await fetch("/api/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId: orgId, name: supplierName }) });
      const json = await res.json();
      if (res.ok && json?.ok) { setSupplierName(""); load(); }
    } finally { setSaving(false); }
  }

  return (
    <>
      <PageHeader eyebrow="Headquarter" title="Purchasing" description="Manage suppliers and purchase orders." />
      <Card className="mt-6">
        <CardTitle>Create supplier</CardTitle>
        <form onSubmit={createSupplier} className="mt-3 flex flex-wrap items-end gap-3">
          <Input label="Supplier name" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required />
          <Button type="submit" loading={saving}>Create supplier</Button>
        </form>
      </Card>
      <div className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-hansan-ink-muted">Suppliers</h2>
        <div className="mt-3 flex flex-col gap-2">
          {suppliers.length === 0 ? <EmptyState title="No suppliers" description="Create a supplier to get started." /> : suppliers.map((s: any) => (
            <Card key={s.id}><CardTitle className="text-base">{s.name}</CardTitle><CardDescription className="mt-1">{s.code ?? "—"} · {s.contactEmail ?? "—"}</CardDescription></Card>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-hansan-ink-muted">Purchase orders</h2>
        <div className="mt-3 flex flex-col gap-2">
          {orders.length === 0 ? <EmptyState title="No purchase orders" description="No purchase orders yet." /> : orders.map((o: any) => (
            <Card key={o.id}>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">PO {o.id.slice(0, 8)}</CardTitle>
                <Badge tone={o.status === "fully_received" ? "success" : o.status === "cancelled" ? "danger" : "orange"}>{o.status}</Badge>
              </div>
              <CardDescription className="mt-1">Total: {Number(o.total).toLocaleString("id-ID")} · {o.status}</CardDescription>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
