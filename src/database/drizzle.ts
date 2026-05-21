import { drizzle, type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";

import * as schema from "./schema";

export const DATABASE_NAME = "app-neri.db";

export type Database = ExpoSQLiteDatabase<typeof schema>;
export type DatabaseSchema = typeof schema;
export type SQLiteConnection = SQLiteDatabase;

let sqliteConnection: SQLiteConnection | null = null;
let database: Database | null = null;
let databasePromise: Promise<Database> | null = null;

async function createDatabase() {
  const sqlite = await SQLite.openDatabaseAsync(DATABASE_NAME, {
    enableChangeListener: true,
  });

  await sqlite.execAsync("PRAGMA foreign_keys = ON;");

  sqliteConnection = sqlite;
  database = drizzle(sqlite, { schema });

  return database;
}

export function initializeDatabase() {
  databasePromise ??= createDatabase();

  return databasePromise;
}

export async function getDatabase() {
  return initializeDatabase();
}

export function getDatabaseSync() {
  if (!database) {
    throw new Error("Database has not been initialized yet.");
  }

  return database;
}

export async function getSQLiteConnection() {
  await initializeDatabase();

  if (!sqliteConnection) {
    throw new Error("SQLite connection has not been initialized yet.");
  }

  return sqliteConnection;
}
