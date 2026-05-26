import { getSQLiteConnection } from "@/database";
import { requireCurrentUser } from "./auth.service";

const RESET_TABLES = [
  "payments",
  "order_items",
  "orders",
  "purchase_items",
  "purchases",
  "product_variants",
  "products",
  "categories",
  "providers",
  "clients",
] as const;

export async function resetApplicationDatabase() {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();

  await sqlite.withTransactionAsync(async () => {
    await sqlite.runAsync("PRAGMA foreign_keys = OFF");

    try {
      for (const table of RESET_TABLES) {
        if (["payments", "order_items", "purchase_items", "product_variants"].includes(table)) {
          continue;
        }

        await sqlite.runAsync(`delete from ${table} where user_id = ?`, user.id);
      }

      await sqlite.runAsync(
        `delete from payments
        where order_id not in (select id from orders)`,
      );
      await sqlite.runAsync(
        `delete from order_items
        where order_id not in (select id from orders)`,
      );
      await sqlite.runAsync(
        `delete from purchase_items
        where purchase_id not in (select id from purchases)`,
      );
      await sqlite.runAsync(
        `delete from product_variants
        where product_id not in (select id from products)`,
      );
    } finally {
      await sqlite.runAsync("PRAGMA foreign_keys = ON");
    }
  });
}
