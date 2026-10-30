import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { recipes, recipeIngredients, menuItems, inventoryMaterials } from "@/db/schema";
import { z } from "zod";

export const createRecipeSchema = z.object({
  organizationId: z.string().uuid(),
  menuItemId: z.string().uuid(),
  outletId: z.string().uuid().optional().nullable(),
});

export const addIngredientSchema = z.object({
  recipeId: z.string().uuid(),
  materialId: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
});

export async function listRecipes(organizationId: string) {
  const db = getDb();
  return db.select().from(recipes).where(eq(recipes.organizationId, organizationId));
}

export async function getRecipeWithIngredients(recipeId: string) {
  const db = getDb();
  const r = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);
  if (r.length === 0) return null;
  const ingredients = await db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
  return { recipe: r[0], ingredients };
}

export async function createRecipe(input: z.infer<typeof createRecipeSchema>) {
  const db = getDb();
  const [row] = await db.insert(recipes).values({
    organizationId: input.organizationId,
    menuItemId: input.menuItemId,
    outletId: input.outletId ?? null,
  }).returning();
  return row;
}

export async function addIngredient(input: z.infer<typeof addIngredientSchema>) {
  const db = getDb();
  const [row] = await db.insert(recipeIngredients).values({
    recipeId: input.recipeId,
    materialId: input.materialId,
    quantity: String(input.quantity),
    unit: input.unit,
  }).returning();
  return row;
}

export async function removeIngredient(id: string) {
  const db = getDb();
  await db.delete(recipeIngredients).where(eq(recipeIngredients.id, id));
  return { ok: true };
}
