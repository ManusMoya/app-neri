import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { orders } from "./orders";
import { productVariants } from "./product-variants";

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade", onUpdate: "cascade" }),
  productVariantId: text("product_variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "restrict", onUpdate: "cascade" }),
  productName: text("product_name").notNull(),
  variantLabel: text("variant_label"),
  sku: text("sku"),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  unitCost: integer("unit_cost").notNull().default(0),
  discountAmount: integer("discount_amount").notNull().default(0),
  lineSubtotal: integer("line_subtotal").notNull(),
  lineCostTotal: integer("line_cost_total").notNull().default(0),
  profitAmount: integer("profit_amount").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index("order_items_order_id_idx").on(table.orderId),
  index("order_items_product_variant_id_idx").on(table.productVariantId),
  check("order_items_quantity_check", sql`${table.quantity} > 0`),
  check("order_items_unit_price_check", sql`${table.unitPrice} >= 0`),
  check("order_items_unit_cost_check", sql`${table.unitCost} >= 0`),
  check("order_items_discount_amount_check", sql`${table.discountAmount} >= 0`),
  check("order_items_line_subtotal_check", sql`${table.lineSubtotal} >= 0`),
  check("order_items_line_cost_total_check", sql`${table.lineCostTotal} >= 0`),
]);

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
