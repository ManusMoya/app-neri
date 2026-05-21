import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { productVariants } from "./product-variants";
import { purchases } from "./purchases";

export const purchaseItems = sqliteTable("purchase_items", {
  id: text("id").primaryKey(),
  purchaseId: text("purchase_id")
    .notNull()
    .references(() => purchases.id, { onDelete: "cascade", onUpdate: "cascade" }),
  productVariantId: text("product_variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "restrict", onUpdate: "cascade" }),
  quantity: integer("quantity").notNull(),
  baseCost: integer("base_cost").notNull(),
  shippingCost: integer("shipping_cost").notNull().default(0),
  realCost: integer("real_cost").notNull(),
  lineTotal: integer("line_total").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index("purchase_items_purchase_id_idx").on(table.purchaseId),
  index("purchase_items_product_variant_id_idx").on(table.productVariantId),
  check("purchase_items_quantity_check", sql`${table.quantity} > 0`),
  check("purchase_items_base_cost_check", sql`${table.baseCost} >= 0`),
  check("purchase_items_shipping_cost_check", sql`${table.shippingCost} >= 0`),
  check("purchase_items_real_cost_check", sql`${table.realCost} >= 0`),
  check("purchase_items_line_total_check", sql`${table.lineTotal} >= 0`),
]);

export type PurchaseItem = typeof purchaseItems.$inferSelect;
export type NewPurchaseItem = typeof purchaseItems.$inferInsert;
