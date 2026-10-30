import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, menuItems, outletMenuConfigs } from "@/db/schema";
import { z } from "zod";

export const createCategorySchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/).optional(),
  displayOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export const createMenuItemSchema = z.object({
  organizationId: z.string().uuid(),
  categoryId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(120),
  sku: z.string().max(60).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  basePrice: z.number().nonnegative(),
  station: z.enum(["kitchen", "bar"]),
});

export const updateMenuItemSchema = z.object({
  categoryId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(120).optional(),
  sku: z.string().max(60).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  basePrice: z.number().nonnegative().optional(),
  station: z.enum(["kitchen", "bar"]).optional(),
  active: z.boolean().optional(),
});

export const outletConfigSchema = z.object({
  outletId: z.string().uuid(),
  menuItemId: z.string().uuid(),
  priceOverride: z.number().nonnegative().optional().nullable(),
  available: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function listCategories(organizationId: string) {
  const db = getDb();
  return db.select().from(categories).where(eq(categories.organizationId, organizationId));
}

export async function createCategory(input: z.infer<typeof createCategorySchema>) {
  const db = getDb();
  const slug = input.slug ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const [row] = await db.insert(categories).values({
    organizationId: input.organizationId,
    name: input.name,
    slug,
    displayOrder: String(input.displayOrder ?? 0),
    active: "true",
  }).returning();
  return row;
}

export async function updateCategory(id: string, input: z.infer<typeof updateCategorySchema>) {
  const db = getDb();
  const patch: any = { updatedAt: new Date() };
  if (input.name !== undefined) patch.name = input.name;
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.displayOrder !== undefined) patch.displayOrder = String(input.displayOrder);
  if (input.active !== undefined) patch.active = String(input.active);
  const [row] = await db.update(categories).set(patch).where(eq(categories.id, id)).returning();
  return row;
}

export async function listMenuItems(organizationId: string, categoryId?: string) {
  const db = getDb();
  const rows = await db.select().from(menuItems).where(eq(menuItems.organizationId, organizationId));
  if (categoryId) return rows.filter((r) => r.categoryId === categoryId);
  return rows;
}

export async function createMenuItem(input: z.infer<typeof createMenuItemSchema>) {
  const db = getDb();
  const [row] = await db.insert(menuItems).values({
    organizationId: input.organizationId,
    categoryId: input.categoryId ?? null,
    name: input.name,
    sku: input.sku ?? null,
    description: input.description ?? null,
    basePrice: String(input.basePrice),
    station: input.station,
    active: "true",
  }).returning();
  return row;
}

export async function updateMenuItem(id: string, input: z.infer<typeof updateMenuItemSchema>) {
  const db = getDb();
  const patch: any = { updatedAt: new Date() };
  if (input.categoryId !== undefined) patch.categoryId = input.categoryId;
  if (input.name !== undefined) patch.name = input.name;
  if (input.sku !== undefined) patch.sku = input.sku;
  if (input.description !== undefined) patch.description = input.description;
  if (input.basePrice !== undefined) patch.basePrice = String(input.basePrice);
  if (input.station !== undefined) patch.station = input.station;
  if (input.active !== undefined) patch.active = String(input.active);
  const [row] = await db.update(menuItems).set(patch).where(eq(menuItems.id, id)).returning();
  return row;
}

export async function getEffectivePrice(menuItem: any, outletId: string): Promise<number> {
  const db = getDb();
  const cfg = await db.select().from(outletMenuConfigs).where(eq(outletMenuConfigs.menuItemId, menuItem.id));
  const oc = cfg.find((c) => c.outletId === outletId);
  if (oc && oc.priceOverride) return Number(oc.priceOverride);
  return Number(menuItem.basePrice);
}

export async function listOutletConfigs(outletId: string) {
  const db = getDb();
  return db.select().from(outletMenuConfigs).where(eq(outletMenuConfigs.outletId, outletId));
}

export async function upsertOutletConfig(input: z.infer<typeof outletConfigSchema>) {
  const db = getDb();
  const existing = await db.select().from(outletMenuConfigs).where(eq(outletMenuConfigs.outletId, input.outletId));
  const dup = existing.find((c) => c.menuItemId === input.menuItemId);
  const values: any = {
    outletId: input.outletId,
    menuItemId: input.menuItemId,
    priceOverride: input.priceOverride != null ? String(input.priceOverride) : null,
    available: String(input.available ?? true),
    active: String(input.active ?? true),
    updatedAt: new Date(),
  };
  if (dup) {
    const [row] = await db.update(outletMenuConfigs).set(values).where(eq(outletMenuConfigs.id, dup.id)).returning();
    return row;
  }
  const [row] = await db.insert(outletMenuConfigs).values(values).returning();
  return row;
}

export async function getOutletCatalog(outletId: string, organizationId: string) {
  const db = getDb();
  const items = await db.select().from(menuItems).where(eq(menuItems.organizationId, organizationId));
  const activeItems = items.filter((i) => i.active === "true");
  const configs = await db.select().from(outletMenuConfigs).where(eq(outletMenuConfigs.outletId, outletId));
  return activeItems.map((item) => {
    const cfg = configs.find((c) => c.menuItemId === item.id);
    const effectivePrice = cfg && cfg.priceOverride ? Number(cfg.priceOverride) : Number(item.basePrice);
    const available = cfg ? cfg.available === "true" && cfg.active === "true" : true;
    return { item, config: cfg ?? null, effectivePrice, available };
  }).filter((x) => x.available);
}
