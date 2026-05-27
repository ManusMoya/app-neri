const crypto = require("crypto");
const pool = require("../db");

function createClientId() {
  return `client_${crypto.randomUUID()}`;
}

function normalizeText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeClientPayload(payload, { partial = false } = {}) {
  const result = {};

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "id")) {
    result.id = normalizeText(payload.id) || createClientId();
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "name")) {
    const name = normalizeText(payload.name);

    if (!name) {
      const error = new Error("El nombre del cliente es obligatorio.");
      error.statusCode = 400;
      throw error;
    }

    result.name = name;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "phone")) {
    result.phone = normalizeText(payload.phone);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "whatsapp_link")) {
    result.whatsapp_link = normalizeText(payload.whatsapp_link);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "debt")) {
    const debt = payload.debt ?? 0;

    if (!Number.isInteger(debt) || debt < 0) {
      const error = new Error("La deuda debe ser un entero no negativo.");
      error.statusCode = 400;
      throw error;
    }

    result.debt = debt;
  }

  return result;
}

async function listClients(searchTerm = "", userId) {
  const normalized = searchTerm.trim();

  if (!normalized) {
    const result = await pool.query(
      `SELECT id, name, phone, whatsapp_link, debt, created_at
       FROM clients
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );

    return result.rows;
  }

  const pattern = `%${normalized}%`;
  const result = await pool.query(
    `SELECT id, name, phone, whatsapp_link, debt, created_at
     FROM clients
     WHERE user_id = $1 AND (name ILIKE $2 OR phone ILIKE $2)
     ORDER BY created_at DESC`,
    [userId, pattern],
  );

  return result.rows;
}

async function getClientById(id, userId) {
  const result = await pool.query(
    `SELECT id, name, phone, whatsapp_link, debt, created_at
     FROM clients
     WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );

  return result.rows[0] || null;
}

async function createClient(payload, userId) {
  const client = normalizeClientPayload(payload);
  const now = Date.now();
  const result = await pool.query(
    `INSERT INTO clients (id, user_id, name, phone, whatsapp_link, debt, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, phone, whatsapp_link, debt, created_at`,
    [client.id, userId, client.name, client.phone, client.whatsapp_link, client.debt, now],
  );

  return result.rows[0];
}

async function updateClient(id, payload, userId) {
  const client = normalizeClientPayload(payload, { partial: true });
  const fields = [];
  const values = [];

  for (const column of ["name", "phone", "whatsapp_link", "debt"]) {
    if (Object.prototype.hasOwnProperty.call(client, column)) {
      values.push(client[column]);
      fields.push(`${column} = $${values.length}`);
    }
  }

  if (fields.length === 0) {
    return getClientById(id, userId);
  }

  values.push(id);
  values.push(userId);
  const result = await pool.query(
    `UPDATE clients
     SET ${fields.join(", ")}
     WHERE id = $${values.length - 1} AND user_id = $${values.length}
     RETURNING id, name, phone, whatsapp_link, debt, created_at`,
    values,
  );

  return result.rows[0] || null;
}

async function deleteClient(id, userId) {
  const result = await pool.query(
    `DELETE FROM clients
     WHERE id = $1 AND user_id = $2
     RETURNING id, name, phone, whatsapp_link, debt, created_at`,
    [id, userId],
  );

  return result.rows[0] || null;
}

module.exports = {
  createClient,
  deleteClient,
  getClientById,
  listClients,
  updateClient,
};
