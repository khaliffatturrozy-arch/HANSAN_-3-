"use client";
import * as React from "react";
import { PageHeader, Card, CardTitle, CardDescription, EmptyState, Button, Input, Alert } from "@/components/ui";

export default function HqRecipesPage() {
  const [recipes, setRecipes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [menuItemId, setMenuItemId] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/recipes?orgSlug=demo");
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error("Failed to load recipes");
      setRecipes(json.recipes ?? []);
    } catch { setError("Failed to load recipes. Retry."); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function createRecipe(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const orgId = (await (async () => { const r = await fetch("/api/outlets?orgSlug=demo"); const j = await r.json(); return j.outlets?.[0]?.organizationId; })());
      const res = await fetch("/api/recipes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", organizationId: orgId, menuItemId }) });
      const json = await res.json();
      if (res.ok && json?.ok) { setMenuItemId(""); load(); }
    } finally { setSaving(false); }
  }

  return (
    <>
      <PageHeader eyebrow="Headquarter" title="Recipes" description="Map menu items to raw materials." />
      <Card className="mt-6">
        <CardTitle>Create recipe</CardTitle>
        <form onSubmit={createRecipe} className="mt-3 flex flex-wrap items-end gap-3">
          <Input label="Menu item ID" value={menuItemId} onChange={(e) => setMenuItemId(e.target.value)} required placeholder="menu item uuid" />
          <Button type="submit" loading={saving}>Create recipe</Button>
        </form>
      </Card>
      <div className="mt-6">
        {loading ? <p className="text-sm text-hansan-ink-muted">Loading recipes…</p> : error ? <div><p className="text-sm text-hansan-danger" role="alert">{error}</p><Button onClick={load} className="mt-3">Retry</Button></div> : recipes.length === 0 ? <EmptyState title="No recipes" description="Create a recipe to get started." /> : (
          <div className="flex flex-col gap-2">
            {recipes.map((r: any) => (
              <Card key={r.id}><CardTitle className="text-base">Recipe {r.id.slice(0, 8)}</CardTitle><CardDescription className="mt-1">Menu item: {r.menuItemId} · Outlet: {r.outletId ?? "org default"}</CardDescription></Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
