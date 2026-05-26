require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "API App Neri funcionando 🚀",
  });
});

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "ok",
      time: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

app.get("/create-main-tables", async (req, res) => {
  try {
    // CATEGORIES
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
        updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
      );
    `);

    // CLIENTS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        whatsapp_link TEXT,
        debt INTEGER NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS clients_name_idx
      ON clients (name);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS clients_phone_idx
      ON clients (phone);
    `);

    // PROVIDERS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS providers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        whatsapp_link TEXT,
        email TEXT,
        address TEXT,
        notes TEXT,
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
        updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS providers_name_idx
      ON providers (name);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS providers_phone_idx
      ON providers (phone);
    `);

    // PRODUCTS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
        updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,

        CONSTRAINT products_category_id_fkey
          FOREIGN KEY (category_id)
          REFERENCES categories(id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE,

        CONSTRAINT products_provider_id_fkey
          FOREIGN KEY (provider_id)
          REFERENCES providers(id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS products_category_id_idx
      ON products (category_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS products_provider_id_idx
      ON products (provider_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS products_name_idx
      ON products (name);
    `);

    res.json({
      status: "ok",
      message: "Tablas principales creadas correctamente",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});