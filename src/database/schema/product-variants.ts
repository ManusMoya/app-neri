import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { products } from "./products";

export const productVariants = sqliteTable("product_variants", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict", onUpdate: "cascade" }),
  color: text("color"),
  size: text("size"),
  model: text("model"),
  sku: text("sku"),
  barcode: text("barcode"),
  stock: integer("stock").notNull().default(0),
  reservedStock: integer("reserved_stock").notNull().default(0),
  minimumStock: integer("minimum_stock").notNull().default(0),
  costPrice: integer("cost_price").notNull().default(0),
  salePrice: integer("sale_price").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index("product_variants_product_id_idx").on(table.productId),
  index("product_variants_color_idx").on(table.color),
  index("product_variants_size_idx").on(table.size),
  uniqueIndex("product_variants_sku_unique").on(table.sku),
  uniqueIndex("product_variants_barcode_unique").on(table.barcode),
  check("product_variants_stock_check", sql`${table.stock} >= 0`),
  check("product_variants_reserved_stock_check", sql`${table.reservedStock} >= 0`),
  check("product_variants_minimum_stock_check", sql`${table.minimumStock} >= 0`),
  check("product_variants_cost_price_check", sql`${table.costPrice} >= 0`),
  check("product_variants_sale_price_check", sql`${table.salePrice} >= 0`),
  check("product_variants_is_active_check", sql`${table.isActive} in (0, 1)`),
]);

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
