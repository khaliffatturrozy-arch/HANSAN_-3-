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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgSlugUnique: uniqueIndex("outlets_org_slug_unique").on(t.organizationId, t.slug),
  orgIdx: index("outlets_org_idx").on(t.organizationId),
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
