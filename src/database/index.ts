import { migrate } from "drizzle-orm/expo-sqlite/migrator";

import migrations from "../../drizzle/migrations";
import { getDatabase } from "./drizzle";

export async function migrateDatabase() {
  const db = await getDatabase();

  await migrate(db, migrations);
}

export * from "./drizzle";
export * from "./schema";
