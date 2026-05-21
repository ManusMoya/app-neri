import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { orders } from "./orders";

export const paymentTypes = ["deposit", "partial", "final", "refund"] as const;
export const paymentMethods = ["cash", "transfer", "card", "other"] as const;
export const paymentStatuses = ["pending", "completed", "cancelled"] as const;

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade", onUpdate: "cascade" }),
  type: text("type", { enum: paymentTypes }).notNull().default("partial"),
  method: text("method", { enum: paymentMethods }).notNull().default("cash"),
  status: text("status", { enum: paymentStatuses }).notNull().default("completed"),
  amount: integer("amount").notNull(),
  reference: text("reference"),
  notes: text("notes"),
  paidAt: integer("paid_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index("payments_order_id_idx").on(table.orderId),
  index("payments_paid_at_idx").on(table.paidAt),
  index("payments_status_idx").on(table.status),
  check("payments_amount_check", sql`${table.amount} >= 0`),
]);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
