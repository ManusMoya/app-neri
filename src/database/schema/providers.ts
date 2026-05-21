import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const providers = sqliteTable("providers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  whatsappLink: text("whatsapp_link"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index("providers_name_idx").on(table.name),
  index("providers_phone_idx").on(table.phone),
]);

export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;
