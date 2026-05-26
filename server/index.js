require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");
const clientsRoutes = require("./routes/clients.routes");
const createNotImplementedRouter = require("./routes/not-implemented.routes");
const { errorHandler, notFound } = require("./middleware/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/clients", clientsRoutes);
app.use("/categories", createNotImplementedRouter("categories"));
app.use("/providers", createNotImplementedRouter("providers"));
app.use("/products", createNotImplementedRouter("products"));
app.use("/product-variants", createNotImplementedRouter("product_variants"));
app.use("/orders", createNotImplementedRouter("orders"));
app.use("/order-items", createNotImplementedRouter("order_items"));
app.use("/payments", createNotImplementedRouter("payments"));
app.use("/purchases", createNotImplementedRouter("purchases"));
app.use("/purchase-items", createNotImplementedRouter("purchase_items"));

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
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

app.get("/tables", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    res.json({
      status: "ok",
      tables: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

app.get("/create-main-tables", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
        updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
      );
    `);

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

    await pool.query(`CREATE INDEX IF NOT EXISTS clients_name_idx ON clients (name);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS clients_phone_idx ON clients (phone);`);

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

    await pool.query(`CREATE INDEX IF NOT EXISTS providers_name_idx ON providers (name);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS providers_phone_idx ON providers (phone);`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
        updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS products_category_id_idx ON products (category_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS products_provider_id_idx ON products (provider_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS products_name_idx ON products (name);`);

    res.json({
      status: "ok",
      message: "Tablas principales creadas correctamente",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

app.get("/create-transaction-tables", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        color TEXT,
        size TEXT,
        model TEXT,
        sku TEXT UNIQUE,
        barcode TEXT UNIQUE,
        stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
        reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
        minimum_stock INTEGER NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
        cost_price INTEGER NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
        sale_price INTEGER NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
        updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON product_variants (product_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS product_variants_color_idx ON product_variants (color);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS product_variants_size_idx ON product_variants (size);`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reserved', 'confirmed', 'delivered', 'cancelled')),
        payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
        subtotal_amount INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_amount >= 0),
        discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
        total_amount INTEGER NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
        deposit_amount INTEGER NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
        paid_amount INTEGER NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
        balance_due INTEGER NOT NULL DEFAULT 0 CHECK (balance_due >= 0),
        notes TEXT,
        ordered_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
        updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS orders_client_id_idx ON orders (client_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders (payment_status);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS orders_ordered_at_idx ON orders (ordered_at);`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
        product_variant_id TEXT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        product_name TEXT NOT NULL,
        variant_label TEXT,
        sku TEXT,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
        unit_cost INTEGER NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
        discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
        line_subtotal INTEGER NOT NULL CHECK (line_subtotal >= 0),
        line_cost_total INTEGER NOT NULL DEFAULT 0 CHECK (line_cost_total >= 0),
        profit_amount INTEGER NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS order_items_product_variant_id_idx ON order_items (product_variant_id);`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
        type TEXT NOT NULL DEFAULT 'partial' CHECK (type IN ('deposit', 'partial', 'final', 'refund')),
        method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'transfer', 'card', 'other')),
        status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
        amount INTEGER NOT NULL CHECK (amount >= 0),
        reference TEXT,
        notes TEXT,
        paid_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS payments_order_id_idx ON payments (order_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS payments_paid_at_idx ON payments (paid_at);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS payments_status_idx ON payments (status);`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id TEXT PRIMARY KEY,
        provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ordered', 'received', 'cancelled')),
        subtotal_amount INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_amount >= 0),
        shipping_amount INTEGER NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
        total_amount INTEGER NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
        paid_amount INTEGER NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
        balance_due INTEGER NOT NULL DEFAULT 0 CHECK (balance_due >= 0),
        reference TEXT,
        notes TEXT,
        purchased_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
        updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS purchases_provider_id_idx ON purchases (provider_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS purchases_status_idx ON purchases (status);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS purchases_purchased_at_idx ON purchases (purchased_at);`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_items (
        id TEXT PRIMARY KEY,
        purchase_id TEXT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE ON UPDATE CASCADE,
        product_variant_id TEXT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        base_cost INTEGER NOT NULL CHECK (base_cost >= 0),
        shipping_cost INTEGER NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
        real_cost INTEGER NOT NULL CHECK (real_cost >= 0),
        line_total INTEGER NOT NULL CHECK (line_total >= 0),
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS purchase_items_purchase_id_idx ON purchase_items (purchase_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS purchase_items_product_variant_id_idx ON purchase_items (product_variant_id);`);

    res.json({
      status: "ok",
      message: "Tablas transaccionales creadas correctamente",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
