import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { providers } from "./providers";

export const purchaseStatuses = [
  "draft",
  "ordered",
  "received",
  "cancelled",
] as const;

export const purchases = sqliteTable("purchases", {
  id: text("id").primaryKey(),
  providerId: text("provider_id")
    .notNull()
    .references(() => providers.id, { onDelete: "restrict", onUpdate: "cascade" }),
  status: text("status", { enum: purchaseStatuses }).notNull().default("draft"),
  subtotalAmount: integer("subtotal_amount").notNull().default(0),
  shippingAmount: integer("shipping_amount").notNull().default(0),
  totalAmount: integer("total_amount").notNull().default(0),
  paidAmount: integer("paid_amount").notNull().default(0),
  balanceDue: integer("balance_due").notNull().default(0),
  reference: text("reference"),
  notes: text("notes"),
  purchasedAt: integer("purchased_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index("purchases_provider_id_idx").on(table.providerId),
  index("purchases_status_idx").on(table.status),
  index("purchases_purchased_at_idx").on(table.purchasedAt),
  check("purchases_subtotal_amount_check", sql`${table.subtotalAmount} >= 0`),
  check("purchases_shipping_amount_check", sql`${table.shippingAmount} >= 0`),
  check("purchases_total_amount_check", sql`${table.totalAmount} >= 0`),
  check("purchases_paid_amount_check", sql`${table.paidAmount} >= 0`),
  check("purchases_balance_due_check", sql`${table.balanceDue} >= 0`),
]);

export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
