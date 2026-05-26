import { getSQLiteConnection } from "./drizzle";

const DEFAULT_USER_ID = "user_neri";
const DEFAULT_USERNAME = "nerinamartinez";
const DEFAULT_PASSWORD = "neri123";
const USER_SCOPED_TABLES = [
  "clients",
  "providers",
  "categories",
  "products",
  "orders",
  "purchases",
] as const;

async function columnExists(tableName: string, columnName: string) {
  const sqlite = await getSQLiteConnection();
  const columns = await sqlite.getAllAsync<{ name: string }>(`pragma table_info(${tableName})`);

  return columns.some((column) => column.name === columnName);
}

export async function runAppMigrations() {
  const sqlite = await getSQLiteConnection();
  const now = Date.now();

  await sqlite.execAsync(`
    create table if not exists users (
      id text primary key,
      username text not null unique,
      password text not null,
      created_at integer not null default (unixepoch() * 1000),
      updated_at integer not null default (unixepoch() * 1000)
    );
  `);

  await sqlite.runAsync(
    `insert or ignore into users (id, username, password, created_at, updated_at)
    values (?, ?, ?, ?, ?)`,
    DEFAULT_USER_ID,
    DEFAULT_USERNAME,
    DEFAULT_PASSWORD,
    now,
    now,
  );

  for (const tableName of USER_SCOPED_TABLES) {
    if (!(await columnExists(tableName, "user_id"))) {
      await sqlite.runAsync(`alter table ${tableName} add column user_id text`);
    }

    await sqlite.runAsync(
      `update ${tableName} set user_id = ? where user_id is null or user_id = ''`,
      DEFAULT_USER_ID,
    );
    await sqlite.runAsync(
      `create index if not exists ${tableName}_user_id_idx on ${tableName}(user_id)`,
    );
  }

  await sqlite.runAsync("drop index if exists categories_name_unique");
  await sqlite.runAsync(
    "create unique index if not exists categories_user_name_unique on categories(user_id, name)",
  );
}
