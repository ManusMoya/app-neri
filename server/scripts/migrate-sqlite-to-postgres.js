require("dotenv").config();

const path = require("path");
const pool = require("../db");

let sqlite3;

try {
  sqlite3 = require("sqlite3").verbose();
} catch (error) {
  console.error("Falta la dependencia sqlite3 para leer el archivo SQLite.");
  console.error("Instalala dentro de /server con: npm install sqlite3");
  process.exit(1);
}

const sqlitePath = process.env.SQLITE_PATH;

if (!sqlitePath) {
  console.error("Defini SQLITE_PATH con la ruta al archivo SQLite exportado.");
  console.error("Ejemplo: SQLITE_PATH=C:\\\\tmp\\\\app-neri.db node scripts/migrate-sqlite-to-postgres.js");
  process.exit(1);
}

function openSqliteDatabase(filename) {
  return new sqlite3.Database(filename, sqlite3.OPEN_READONLY);
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

function close(db) {
  return new Promise((resolve, reject) => {
    db.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

const migrations = [
  {
    name: "categories",
    select: "SELECT id, name, description, created_at, updated_at FROM categories",
    insert: `
      INSERT INTO categories (id, name, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at
    `,
    values: (row) => [
      row.id,
      row.name,
      row.description,
      Number(row.created_at),
      Number(row.updated_at),
    ],
  },
  {
    name: "providers",
    select: `
      SELECT id, name, phone, whatsapp_link, email, address, notes, created_at, updated_at
      FROM providers
    `,
    insert: `
      INSERT INTO providers
        (id, name, phone, whatsapp_link, email, address, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        whatsapp_link = EXCLUDED.whatsapp_link,
        email = EXCLUDED.email,
        address = EXCLUDED.address,
        notes = EXCLUDED.notes,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at
    `,
    values: (row) => [
      row.id,
      row.name,
      row.phone,
      row.whatsapp_link,
      row.email,
      row.address,
      row.notes,
      Number(row.created_at),
      Number(row.updated_at),
    ],
  },
  {
    name: "clients",
    select: "SELECT id, name, phone, whatsapp_link, debt, created_at FROM clients",
    insert: `
      INSERT INTO clients (id, name, phone, whatsapp_link, debt, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        whatsapp_link = EXCLUDED.whatsapp_link,
        debt = EXCLUDED.debt,
        created_at = EXCLUDED.created_at
    `,
    values: (row) => [
      row.id,
      row.name,
      row.phone,
      row.whatsapp_link,
      Number(row.debt || 0),
      Number(row.created_at),
    ],
  },
  // Patron para continuar:
  // 1. Agregar la tabla respetando el orden de dependencias.
  // 2. Seleccionar solo columnas existentes en PostgreSQL.
  // 3. Usar INSERT parametrizado con ON CONFLICT (id) DO UPDATE.
];

async function migrateTable(sqlite, pgClient, migration) {
  const rows = await all(sqlite, migration.select);

  for (const row of rows) {
    await pgClient.query(migration.insert, migration.values(row));
  }

  console.log(`${migration.name}: ${rows.length} filas migradas`);
}

async function main() {
  const resolvedSqlitePath = path.resolve(sqlitePath);
  const sqlite = openSqliteDatabase(resolvedSqlitePath);
  const pgClient = await pool.connect();

  try {
    await pgClient.query("BEGIN");

    for (const migration of migrations) {
      await migrateTable(sqlite, pgClient, migration);
    }

    await pgClient.query("COMMIT");
    console.log("Migracion completada.");
  } catch (error) {
    await pgClient.query("ROLLBACK");
    console.error("Migracion cancelada:", error.message);
    process.exitCode = 1;
  } finally {
    pgClient.release();
    await close(sqlite);
    await pool.end();
  }
}

main();
