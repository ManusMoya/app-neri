import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { clients } from "./clients";

export const orderStatuses = [
  "draft",
  "reserved",
  "confirmed",
  "delivered",
  "cancelled",
] as const;

export const orderPaymentStatuses = [
  "unpaid",
  "partial",
  "paid",
  "refunded",
] as const;

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict", onUpdate: "cascade" }),
  status: text("status", { enum: orderStatuses }).notNull().default("draft"),
  paymentStatus: text("payment_status", { enum: orderPaymentStatuses })
    .notNull()
    .default("unpaid"),
  subtotalAmount: integer("subtotal_amount").notNull().default(0),
  discountAmount: integer("discount_amount").notNull().default(0),
  totalAmount: integer("total_amount").notNull().default(0),
  depositAmount: integer("deposit_amount").notNull().default(0),
  paidAmount: integer("paid_amount").notNull().default(0),
  balanceDue: integer("balance_due").notNull().default(0),
  notes: text("notes"),
  orderedAt: integer("ordered_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index("orders_client_id_idx").on(table.clientId),
  index("orders_status_idx").on(table.status),
  index("orders_payment_status_idx").on(table.paymentStatus),
  index("orders_ordered_at_idx").on(table.orderedAt),
  check("orders_subtotal_amount_check", sql`${table.subtotalAmount} >= 0`),
  check("orders_discount_amount_check", sql`${table.discountAmount} >= 0`),
  check("orders_total_amount_check", sql`${table.totalAmount} >= 0`),
  check("orders_deposit_amount_check", sql`${table.depositAmount} >= 0`),
  check("orders_paid_amount_check", sql`${table.paidAmount} >= 0`),
  check("orders_balance_due_check", sql`${table.balanceDue} >= 0`),
]);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
