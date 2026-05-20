/**
 * BENOT – Drizzle ORM schema (PostgreSQL)
 *
 * All monetary values stored as INTEGER (cents).
 * JSONB columns hold complex sub-structures (cart items, sizes, zones, etc.)
 * to avoid deep normalisation while keeping SQL query capability.
 */
import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uuid,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* ── Enums ─────────────────────────────────────────────────────────── */

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "production_sent",
  "in_production",
  "shipped",
  "delivered",
]);

export const productionStatusEnum = pgEnum("production_status", [
  "pending",
  "queued",
  "printing",
  "completed",
  "shipped",
]);

export const productTypeEnum = pgEnum("product_type", [
  "premium_custom",
  "running_fullprint",
  "solidary_standard",
]);

export const payoutStatusEnum = pgEnum("payout_status", [
  "pending",
  "transferred",
  "failed",
]);

export const issueStatusEnum = pgEnum("issue_status", [
  "open",
  "resolved",
  "ignored",
]);

/* ── Orders ─────────────────────────────────────────────────────────── */

export const orders = pgTable(
  "orders",
  {
    id:               uuid("id").primaryKey().defaultRandom(),
    orderRef:         text("order_ref").notNull().unique(),
    stripeSessionId:  text("stripe_session_id").notNull().unique(),
    status:           orderStatusEnum("status").notNull().default("pending"),
    customerName:     text("customer_name").notNull().default(""),
    customerEmail:    text("customer_email").notNull(),
    customerPhone:    text("customer_phone"),
    shippingAddress:  jsonb("shipping_address"),              // ShippingAddress
    shippingOption:   text("shipping_option"),
    subtotalAmount:   integer("subtotal_amount").notNull(),
    shippingAmount:   integer("shipping_amount").notNull().default(0),
    totalAmount:      integer("total_amount").notNull(),
    currency:         text("currency").notNull().default("eur"),
    frozenAssets:     jsonb("frozen_assets"),                 // FrozenAsset[]
    productionPdfs:   jsonb("production_pdfs"),               // Record<string, string>
    createdAt:        timestamp("created_at").notNull().defaultNow(),
    updatedAt:        timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("orders_customer_email_idx").on(t.customerEmail),
    index("orders_status_idx").on(t.status),
    index("orders_created_at_idx").on(t.createdAt),
  ]
);

/* ── Order Items ────────────────────────────────────────────────────── */

export const orderItems = pgTable(
  "order_items",
  {
    id:               uuid("id").primaryKey().defaultRandom(),
    orderId:          uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productType:      productTypeEnum("product_type").notNull(),
    productName:      text("product_name").notNull(),
    providerId:       text("provider_id"),                    // soft ref → providers.id
    productionStatus: productionStatusEnum("production_status").notNull().default("pending"),

    // premium_custom fields
    color:            text("color"),
    phraseCode:       text("phrase_code"),
    designCode:       text("design_code"),
    designCategory:   text("design_category"),

    // running_fullprint fields
    printZones:       jsonb("print_zones"),                   // PrintZone[]
    finalPreview:     text("final_preview"),

    // solidary_standard fields
    itemCode:         text("item_code"),

    // shipping tracking (per-item)
    carrier:          text("carrier"),
    trackingNumber:   text("tracking_number"),
    trackingUrl:      text("tracking_url"),
    shippedAt:        timestamp("shipped_at"),

    // common
    sizes:            jsonb("sizes").notNull(),               // SizeMap
    quantity:         integer("quantity").notNull(),
    unitPrice:        integer("unit_price").notNull(),
    subtotal:         integer("subtotal").notNull(),
    createdAt:        timestamp("created_at").notNull().defaultNow(),
    updatedAt:        timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("order_items_order_id_idx").on(t.orderId),
    index("order_items_provider_id_idx").on(t.providerId),
  ]
);

/* ── Order Events (audit trail) ─────────────────────────────────────── */

export const orderEvents = pgTable(
  "order_events",
  {
    id:        uuid("id").primaryKey().defaultRandom(),
    orderId:   uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    event:     text("event").notNull(),                       // "order_created", "status_changed", ...
    data:      jsonb("data"),                                 // event-specific payload
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("order_events_order_id_idx").on(t.orderId),
    index("order_events_created_at_idx").on(t.createdAt),
  ]
);

/* ── Providers ──────────────────────────────────────────────────────── */

export const providers = pgTable("providers", {
  id:                     text("id").primaryKey(),
  name:                   text("name").notNull(),
  email:                  text("email").notNull(),
  stripeAccountId:        text("stripe_account_id"),
  stripePayoutsEnabled:   boolean("stripe_payouts_enabled"),
  stripeChargesEnabled:   boolean("stripe_charges_enabled"),
  stripeDetailsSubmitted: boolean("stripe_details_submitted"),
  stripeLastSyncedAt:     timestamp("stripe_last_synced_at"),
  active:                 boolean("active").notNull().default(true),
  feePercent:             integer("fee_percent").notNull().default(30),
  createdAt:              timestamp("created_at").notNull().defaultNow(),
});

/* ── Provider → ProductType (many-to-many) ──────────────────────────── */

export const providerProductTypes = pgTable(
  "provider_product_types",
  {
    providerId:  text("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
    productType: productTypeEnum("product_type").notNull(),
  },
  (t) => [primaryKey({ columns: [t.providerId, t.productType] })]
);

/* ── Product Configs (admin-editable) ───────────────────────────────── */

export const productConfigs = pgTable("product_configs", {
  productType:             productTypeEnum("product_type").primaryKey(),
  basePrice:               integer("base_price").notNull(),
  providerCost:            integer("provider_cost").notNull(),
  shippingCost:            integer("shipping_cost").notNull(),
  urgentShippingCost:      integer("urgent_shipping_cost").notNull(),
  freeShippingThreshold:   integer("free_shipping_threshold").notNull(),
  discountActive:          boolean("discount_active").notNull().default(false),
  discountPercent:         integer("discount_percent").notNull().default(0),
  active:                  boolean("active").notNull().default(true),
  estimatedProductionDays: integer("estimated_production_days").notNull().default(3),
  estimatedShippingDays:   integer("estimated_shipping_days").notNull().default(5),
  updatedAt:               timestamp("updated_at").notNull().defaultNow(),
});

/* ── Payouts ────────────────────────────────────────────────────────── */

export const payouts = pgTable(
  "payouts",
  {
    id:               uuid("id").primaryKey().defaultRandom(),
    orderId:          uuid("order_id").notNull().references(() => orders.id),
    providerId:       text("provider_id").notNull().references(() => providers.id),
    amount:           integer("amount").notNull(),
    stripeTransferId: text("stripe_transfer_id"),
    status:           payoutStatusEnum("status").notNull().default("pending"),
    createdAt:        timestamp("created_at").notNull().defaultNow(),
    updatedAt:        timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("payouts_order_id_idx").on(t.orderId),
    index("payouts_provider_id_idx").on(t.providerId),
  ]
);

/* ── Issues (operational) ───────────────────────────────────────────── */

export const issues = pgTable(
  "issues",
  {
    id:         uuid("id").primaryKey().defaultRandom(),
    orderId:    uuid("order_id").references(() => orders.id),
    type:       text("type").notNull(),
    status:     issueStatusEnum("status").notNull().default("open"),
    notes:      text("notes"),
    createdAt:  timestamp("created_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
  },
  (t) => [index("issues_status_idx").on(t.status)]
);

/* ── Pending Carts ──────────────────────────────────────────────────── */

export const pendingCarts = pgTable("pending_carts", {
  sessionId: text("session_id").primaryKey(),
  cart:      jsonb("cart").notNull(),                         // CartItem[]
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ── Counters (order ref sequence) ─────────────────────────────────── */

export const counters = pgTable("counters", {
  key:   text("key").primaryKey(),
  value: integer("value").notNull().default(0),
});

/* ── Admin Sessions ─────────────────────────────────────────────────── */

export const sessions = pgTable(
  "sessions",
  {
    id:          uuid("id").primaryKey().defaultRandom(),
    token:       text("token").notNull().unique(),
    createdAt:   timestamp("created_at").notNull().defaultNow(),
    expiresAt:   timestamp("expires_at").notNull(),
    lastSeenAt:  timestamp("last_seen_at").notNull().defaultNow(),
    ipAddress:   text("ip_address"),
    userAgent:   text("user_agent"),
  },
  (t) => [index("sessions_token_idx").on(t.token)]
);

/* ── Admin User (single user) ───────────────────────────────────────── */

export const adminUser = pgTable("admin_user", {
  id:           integer("id").primaryKey().default(1),
  email:        text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
});

/* ── Inferred types (Drizzle selects) ───────────────────────────────── */

export type DbOrder         = typeof orders.$inferSelect;
export type DbOrderInsert   = typeof orders.$inferInsert;
export type DbOrderItem     = typeof orderItems.$inferSelect;
export type DbProvider      = typeof providers.$inferSelect;
export type DbProductConfig = typeof productConfigs.$inferSelect;
export type DbPayout        = typeof payouts.$inferSelect;
export type DbSession       = typeof sessions.$inferSelect;
export type DbAdminUser     = typeof adminUser.$inferSelect;
