import { pgTable, uuid, text, timestamp, jsonb, uniqueIndex, index, foreignKey } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const outlets = pgTable("outlets", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  code: text("code").notNull(),
  address: text("address"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  status: text("status").notNull().default("active"),
  deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgSlugUnique: uniqueIndex("outlets_org_slug_unique").on(t.organizationId, t.slug),
  orgCodeUnique: uniqueIndex("outlets_org_code_unique").on(t.organizationId, t.code),
  orgIdx: index("outlets_org_idx").on(t.organizationId),
  statusIdx: index("outlets_status_idx").on(t.status),
}));

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  supabaseUserId: text("supabase_user_id").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const organizationMemberships = pgTable("organization_memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqueMembership: uniqueIndex("org_memberships_user_org_unique").on(t.userId, t.organizationId),
  orgIdx: index("org_memberships_org_idx").on(t.organizationId),
}));

export const outletMemberships = pgTable("outlet_memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  outletId: uuid("outlet_id").notNull().references(() => outlets.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqueMembership: uniqueIndex("outlet_memberships_user_outlet_unique").on(t.userId, t.outletId),
  outletIdx: index("outlet_memberships_outlet_idx").on(t.outletId),
}));

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  outletId: uuid("outlet_id").references(() => outlets.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("audit_logs_org_idx").on(t.organizationId),
  actorIdx: index("audit_logs_actor_idx").on(t.actorUserId),
}));

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const rolePermissions = pgTable("role_permissions", {
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  pk: uniqueIndex("role_permissions_pk").on(t.roleId, t.permissionId),
}));

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  outletId: uuid("outlet_id").notNull().references(() => outlets.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  subtotal: text("subtotal").notNull().default("0"),
  tax: text("tax").notNull().default("0"),
  total: text("total").notNull().default("0"),
  idempotencyKey: text("idempotency_key").notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("orders_org_idx").on(t.organizationId),
  outletIdx: index("orders_outlet_idx").on(t.outletId),
  idempotencyUnique: uniqueIndex("orders_idempotency_unique").on(t.idempotencyKey),
  statusIdx: index("orders_status_idx").on(t.status),
}));

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull(),
  name: text("name").notNull(),
  station: text("station").notNull(),
  price: text("price").notNull(),
  qty: text("qty").notNull(),
  subtotal: text("subtotal").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orderIdx: index("order_items_order_idx").on(t.orderId),
}));

export const orderStationTickets = pgTable("order_station_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  station: text("station").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orderStationUnique: uniqueIndex("order_station_tickets_order_station_unique").on(t.orderId, t.station),
  stationIdx: index("order_station_tickets_station_idx").on(t.station),
}));

export const orderStatusHistory = pgTable("order_status_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orderIdx: index("order_status_history_order_idx").on(t.orderId),
}));

export const orderEvents = pgTable("order_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventType: text("event_type").notNull(),
  version: text("version").notNull().default("1"),
  organizationId: uuid("organization_id").notNull(),
  outletId: uuid("outlet_id").notNull(),
  orderId: uuid("order_id").notNull(),
  station: text("station"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});


export const outletSettings = pgTable("outlet_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  outletId: uuid("outlet_id").notNull().references(() => outlets.id, { onDelete: "cascade" }).unique(),
  timezone: text("timezone").notNull().default("Asia/Jakarta"),
  businessHours: jsonb("business_hours"),
  kitchenActive: text("kitchen_active").notNull().default("true"),
  barActive: text("bar_active").notNull().default("true"),
  kitchenName: text("kitchen_name").notNull().default("Kitchen"),
  barName: text("bar_name").notNull().default("Bar"),
  kitchenDisplayOrder: text("kitchen_display_order").notNull().default("0"),
  barDisplayOrder: text("bar_display_order").notNull().default("1"),
  acceptOrders: text("accept_orders").notNull().default("true"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("outlet_settings_org_idx").on(t.organizationId),
  outletIdx: index("outlet_settings_outlet_idx").on(t.outletId),
}));

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  displayOrder: text("display_order").notNull().default("0"),
  active: text("active").notNull().default("true"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgSlugUnique: uniqueIndex("categories_org_slug_unique").on(t.organizationId, t.slug),
  orgIdx: index("categories_org_idx").on(t.organizationId),
}));

export const menuItems = pgTable("menu_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  sku: text("sku"),
  description: text("description"),
  basePrice: text("base_price").notNull(),
  station: text("station").notNull(),
  active: text("active").notNull().default("true"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("menu_items_org_idx").on(t.organizationId),
  categoryIdx: index("menu_items_category_idx").on(t.categoryId),
}));

export const outletMenuConfigs = pgTable("outlet_menu_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  outletId: uuid("outlet_id").notNull().references(() => outlets.id, { onDelete: "cascade" }),
  menuItemId: uuid("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  priceOverride: text("price_override"),
  available: text("available").notNull().default("true"),
  active: text("active").notNull().default("true"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  outletItemUnique: uniqueIndex("outlet_menu_configs_outlet_item_unique").on(t.outletId, t.menuItemId),
  outletIdx: index("outlet_menu_configs_outlet_idx").on(t.outletId),
}));

export const inventoryMaterials = pgTable("inventory_materials", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sku: text("sku"),
  category: text("category"),
  baseUnit: text("base_unit").notNull(),
  minStock: text("min_stock").notNull().default("0"),
  active: text("active").notNull().default("true"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("inventory_materials_org_idx").on(t.organizationId),
}));

export const inventoryStock = pgTable("inventory_stock", {
  id: uuid("id").defaultRandom().primaryKey(),
  outletId: uuid("outlet_id").notNull().references(() => outlets.id, { onDelete: "cascade" }),
  materialId: uuid("material_id").notNull().references(() => inventoryMaterials.id, { onDelete: "cascade" }),
  quantity: text("quantity").notNull().default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  outletMaterialUnique: uniqueIndex("inventory_stock_outlet_material_unique").on(t.outletId, t.materialId),
}));

export const inventoryMovements = pgTable("inventory_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  outletId: uuid("outlet_id").notNull().references(() => outlets.id, { onDelete: "cascade" }),
  materialId: uuid("material_id").notNull().references(() => inventoryMaterials.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  quantity: text("quantity").notNull(),
  unit: text("unit").notNull(),
  reference: text("reference"),
  reason: text("reason"),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  outletIdx: index("inventory_movements_outlet_idx").on(t.outletId),
  materialIdx: index("inventory_movements_material_idx").on(t.materialId),
}));

export const stockOpnameSessions = pgTable("stock_opname_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  outletId: uuid("outlet_id").notNull().references(() => outlets.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const stockOpnameItems = pgTable("stock_opname_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull().references(() => stockOpnameSessions.id, { onDelete: "cascade" }),
  materialId: uuid("material_id").notNull().references(() => inventoryMaterials.id, { onDelete: "cascade" }),
  expectedQty: text("expected_qty").notNull(),
  actualQty: text("actual_qty").notNull(),
  variance: text("variance").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: text("code"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  active: text("active").notNull().default("true"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("suppliers_org_idx").on(t.organizationId),
}));

export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  outletId: uuid("outlet_id").notNull().references(() => outlets.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  status: text("status").notNull().default("draft"),
  total: text("total").notNull().default("0"),
  idempotencyKey: text("idempotency_key").notNull(),
  expectedDelivery: timestamp("expected_delivery", { withTimezone: true }),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("purchase_orders_org_idx").on(t.organizationId),
  outletIdx: index("purchase_orders_outlet_idx").on(t.outletId),
  idempotencyUnique: uniqueIndex("purchase_orders_idempotency_unique").on(t.idempotencyKey),
}));

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  purchaseOrderId: uuid("purchase_order_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  materialId: uuid("material_id").notNull().references(() => inventoryMaterials.id, { onDelete: "restrict" }),
  quantity: text("quantity").notNull(),
  unit: text("unit").notNull(),
  unitCost: text("unit_cost").notNull(),
  subtotal: text("subtotal").notNull(),
  receivedQty: text("received_qty").notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  poIdx: index("purchase_order_items_po_idx").on(t.purchaseOrderId),
}));

export const purchaseReceivings = pgTable("purchase_receivings", {
  id: uuid("id").defaultRandom().primaryKey(),
  purchaseOrderId: uuid("purchase_order_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  receivedBy: uuid("received_by").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  poIdx: index("purchase_receivings_po_idx").on(t.purchaseOrderId),
}));

export const recipes = pgTable("recipes", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  menuItemId: uuid("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  outletId: uuid("outlet_id").references(() => outlets.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  menuItemOutletUnique: uniqueIndex("recipes_menu_item_outlet_unique").on(t.menuItemId, t.outletId),
}));

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeId: uuid("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  materialId: uuid("material_id").notNull().references(() => inventoryMaterials.id, { onDelete: "restrict" }),
  quantity: text("quantity").notNull(),
  unit: text("unit").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  recipeIdx: index("recipe_ingredients_recipe_idx").on(t.recipeId),
}));
