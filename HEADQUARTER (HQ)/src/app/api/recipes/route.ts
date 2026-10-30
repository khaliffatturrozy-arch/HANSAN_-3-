import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { organizations, users } from "@/db/schema";
import { createRecipeSchema, addIngredientSchema, listRecipes, createRecipe, addIngredient, removeIngredient } from "@/lib/recipes";
import { getSupabaseUser } from "@/lib/auth/supabase";
import { resolveAccess } from "@/lib/users";

async function resolveRequestUser(req: NextRequest) {
  const authUser = await getSupabaseUser(req);
  if (authUser) { const { upsertUser } = await import("@/lib/users"); const p = await upsertUser(authUser.id, authUser.email ?? ""); return p.supabaseUserId; }
  if (process.env.NODE_ENV === "production") return null;
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.supabaseUserId, "demo-user-00000000-0000-0000-0000-000000000000")).limit(1);
  return rows[0]?.supabaseUserId ?? null;
}

export async function GET(req: NextRequest) {
  const orgSlug = new URL(req.url).searchParams.get("orgSlug") ?? "demo";
  const db = getDb();
  const orgRows = await db.select().from(organizations).where(eq(organizations.slug, orgSlug)).limit(1);
  if (orgRows.length === 0) return NextResponse.json({ ok: false, error: { code: "ORG_NOT_FOUND", message: "Organization not found." } }, { status: 404 });
  const org = orgRows[0];
  const supabaseUserId = await resolveRequestUser(req);
  if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  try { await resolveAccess(supabaseUserId, org.id, undefined, ["owner", "admin", "manager", "developer", "pos", "kds", "finance", "staff"]); } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  const recipes = await listRecipes(org.id);
  return NextResponse.json({ ok: true, recipes });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON body." } }, { status: 400 }); }
  const parsed = z.discriminatedUnion("action", [
    z.object({ action: z.literal("create"), organizationId: z.string().uuid(), menuItemId: z.string().uuid(), outletId: z.string().uuid().optional().nullable() }),
    z.object({ action: z.literal("addIngredient"), recipeId: z.string().uuid(), materialId: z.string().uuid(), quantity: z.number().positive(), unit: z.string().min(1) }),
    z.object({ action: z.literal("removeIngredient"), ingredientId: z.string().uuid() }),
  ]).safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
  const d = parsed.data;
  if (d.action === "create") {
    const { createRecipeSchema, createRecipe } = await import("@/lib/recipes");
    const p = createRecipeSchema.safeParse({ organizationId: d.organizationId, menuItemId: d.menuItemId, outletId: d.outletId });
    if (!p.success) return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: p.error.message } }, { status: 400 });
    const recipe = await createRecipe(p.data);
    return NextResponse.json({ ok: true, recipe }, { status: 201 });
  }
  if (d.action === "addIngredient") {
    const { addIngredientSchema, addIngredient } = await import("@/lib/recipes");
    const p = addIngredientSchema.safeParse({ recipeId: d.recipeId, materialId: d.materialId, quantity: d.quantity, unit: d.unit });
    if (!p.success) return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: p.error.message } }, { status: 400 });
    const ing = await addIngredient(p.data);
    return NextResponse.json({ ok: true, ingredient: ing }, { status: 201 });
  }
  if (d.action === "removeIngredient") {
    const { removeIngredient } = await import("@/lib/recipes");
    await removeIngredient(d.ingredientId);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: { code: "INVALID_ACTION", message: "Invalid action" } }, { status: 400 });
}
