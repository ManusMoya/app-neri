import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  whatsappLink: text("whatsapp_link"),
  debt: integer("debt").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index("clients_name_idx").on(table.name),
  index("clients_phone_idx").on(table.phone),
]);

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
