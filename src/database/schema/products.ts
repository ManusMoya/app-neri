import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { categories } from "./categories";
import { providers } from "./providers";

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict", onUpdate: "cascade" }),
  providerId: text("provider_id")
    .notNull()
    .references(() => providers.id, { onDelete: "restrict", onUpdate: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index("products_category_id_idx").on(table.categoryId),
  index("products_provider_id_idx").on(table.providerId),
  index("products_name_idx").on(table.name),
  check("products_is_active_check", sql`${table.isActive} in (0, 1)`),
]);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
