import { migrate } from "drizzle-orm/expo-sqlite/migrator";

import migrations from "../../drizzle/migrations";
import { runAppMigrations } from "./app-migrations";
import { getDatabase } from "./drizzle";

export async function migrateDatabase() {
  const db = await getDatabase();

  await migrate(db, migrations);
  await runAppMigrations();
}

export * from "./drizzle";
export * from "./schema";
