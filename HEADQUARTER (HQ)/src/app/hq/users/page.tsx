"use client";
import * as React from "react";
import { PageHeader, Card, CardTitle, CardDescription, EmptyState, Badge, Button, Input, Alert } from "@/components/ui";

interface User { id: string; email: string; displayName: string | null; orgRole: string; orgMembershipId: string; }
interface UserDetail { user: any; orgMemberships: any[]; outletMemberships: any[]; }

export default function HqUsersPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("");
  const [selected, setSelected] = React.useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [newMemberEmail, setNewMemberEmail] = React.useState("");
  const [newMemberRole, setNewMemberRole] = React.useState("staff");
  const [newMemberType, setNewMemberType] = React.useState<"org" | "outlet">("org");
  const [newMemberOutlet, setNewMemberOutlet] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [orgId, setOrgId] = React.useState<string>("");

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/users?orgSlug=demo");
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error("Failed to load users");
      setUsers(json.users ?? []);
      try { const r = await fetch("/api/outlets?orgSlug=demo"); const j = await r.json(); if (j?.ok && j.outlets?.[0]) setOrgId(j.outlets[0].organizationId); } catch {}
    } catch {
      setError("Failed to load users. Retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) => {
    if (roleFilter && u.orgRole !== roleFilter) return false;
    if (search && !u.email.toLowerCase().includes(search.toLowerCase()) && !(u.displayName ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function openDetail(u: User) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/users/${u.id}`);
      const json = await res.json();
      if (res.ok && json?.ok) setSelected(json);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleAddMembership(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setFormError(null);
    try {
      // resolve user by email (demo: find in list)
      const target = users.find((u) => u.email.toLowerCase() === newMemberEmail.toLowerCase());
      if (!target) { setFormError("User not found in directory."); return; }
      const body = newMemberType === "org"
        ? { type: "org", userId: target.id, organizationId: selected?.user ? undefined : undefined, role: newMemberRole }
        : { type: "outlet", userId: target.id, outletId: newMemberOutlet, role: newMemberRole };
      // need orgId for org membership; fetch from first org membership
      if (newMemberType === "org") {
        // get org id from existing membership
        const orgId = selected?.orgMemberships?.[0]?.organizationId;
        if (!orgId) { setFormError("Organization not resolved."); return; }
        (body as any).organizationId = orgId;
      }
      const res = await fetch("/api/users/memberships", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok || !json?.ok) { setFormError(json?.error?.message ?? "Failed"); return; }
      setNewMemberEmail(""); load();
      if (selected) openDetail(users.find((u) => u.id === target.id)!);
    } catch { setFormError("Network error"); }
    finally { setSaving(false); }
  }

  async function removeMembership(id: string, type: "org" | "outlet") {
    await fetch(`/api/users/memberships/${id}?type=${type}`, { method: "DELETE" });
    if (selected) openDetail({ id: selected.user.id } as User);
    load();
  }

  async function updateRole(id: string, type: "org" | "outlet", role: string) {
    await fetch(`/api/users/memberships/${id}?type=${type}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    if (selected) openDetail({ id: selected.user.id } as User);
    load();
  }

  return (
    <>
      <PageHeader eyebrow="Headquarter" title="Users" description="Manage organization and outlet memberships." />
      <Card className="mt-6">
        <div className="flex flex-wrap items-end gap-3">
          <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="email or name" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-hansan-ink-muted">Role</label>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full rounded-sm border border-hansan-line bg-hansan-surface-raised px-3 py-2 text-sm text-hansan-ink">
              <option value="">All</option>
              <option value="owner">owner</option>
              <option value="admin">admin</option>
              <option value="manager">manager</option>
              <option value="staff">staff</option>
              <option value="pos">pos</option>
              <option value="kds">kds</option>
              <option value="finance">finance</option>
              <option value="developer">developer</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-hansan-ink-muted">Loading users…</p>
        ) : error ? (
          <div><p className="text-sm text-hansan-danger" role="alert">{error}</p><Button onClick={load} className="mt-3">Retry</Button></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No users" description="No users match the current filter." />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((u) => (
              <Card key={u.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{u.displayName ?? u.email}</CardTitle>
                  <Badge tone="blue">{u.orgRole}</Badge>
                </div>
                <CardDescription className="mt-1">{u.email}</CardDescription>
                <div className="mt-3">
                  <Button variant="secondary" onClick={() => openDetail(u)} disabled={detailLoading}>View details</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-dialog flex items-center justify-center bg-hansan-ink/40 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-sm border border-hansan-line bg-hansan-surface-raised p-6 shadow-neu-raised">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-hansan-ink">{selected.user.displayName ?? selected.user.email}</h2>
              <button onClick={() => setSelected(null)} className="rounded-xs px-2 py-1 text-xs font-semibold text-hansan-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-hansan-blue">Close</button>
            </div>
            <p className="mt-1 text-xs text-hansan-ink-muted">{selected.user.email}</p>

            <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-hansan-ink-muted">Organization memberships</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {selected.orgMemberships.map((m: any) => (
                <li key={m.id} className="flex items-center justify-between rounded-sm border border-hansan-line bg-hansan-surface-soft px-3 py-2 text-sm">
                  <span>{m.role} (org {m.organizationId.slice(0, 6)})</span>
                  <div className="flex gap-2">
                    <select value={m.role} onChange={(e) => updateRole(m.id, "org", e.target.value)} className="rounded-sm border border-hansan-line bg-hansan-surface-raised px-2 py-1 text-xs">
                      {["owner", "admin", "manager", "staff", "pos", "kds", "finance", "developer"].map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button onClick={() => removeMembership(m.id, "org")} className="text-xs font-semibold text-hansan-danger">Remove</button>
                  </div>
                </li>
              ))}
            </ul>

            <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-hansan-ink-muted">Outlet memberships</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {selected.outletMemberships.map((m: any) => (
                <li key={m.id} className="flex items-center justify-between rounded-sm border border-hansan-line bg-hansan-surface-soft px-3 py-2 text-sm">
                  <span>{m.role} (outlet {m.outletId.slice(0, 6)})</span>
                  <div className="flex gap-2">
                    <select value={m.role} onChange={(e) => updateRole(m.id, "outlet", e.target.value)} className="rounded-sm border border-hansan-line bg-hansan-surface-raised px-2 py-1 text-xs">
                      {["owner", "admin", "manager", "staff", "pos", "kds", "finance", "developer"].map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button onClick={() => removeMembership(m.id, "outlet")} className="text-xs font-semibold text-hansan-danger">Remove</button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-hansan-line pt-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-hansan-ink-muted">Add membership</h3>
              <form onSubmit={handleAddMembership} className="mt-2 flex flex-col gap-3">
                <Input label="User email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} placeholder="user@hansan.local" />
                <div className="flex gap-2">
                  <select value={newMemberType} onChange={(e) => setNewMemberType(e.target.value as any)} className="rounded-sm border border-hansan-line bg-hansan-surface-raised px-3 py-2 text-sm text-hansan-ink">
                    <option value="org">Organization</option>
                    <option value="outlet">Outlet</option>
                  </select>
                  <select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} className="rounded-sm border border-hansan-line bg-hansan-surface-raised px-3 py-2 text-sm text-hansan-ink">
                    {["owner", "admin", "manager", "staff", "pos", "kds", "finance", "developer"].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                {newMemberType === "outlet" && (
                  <Input label="Outlet ID" value={newMemberOutlet} onChange={(e) => setNewMemberOutlet(e.target.value)} placeholder="outlet uuid" />
                )}
                {formError && <Alert variant="danger">{formError}</Alert>}
                <Button type="submit" loading={saving} className="w-full">Add membership</Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


