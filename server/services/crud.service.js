const pool = require("../db");

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function createId(prefix) {
  return `${prefix}_${cryptoRandomId()}`;
}

function cryptoRandomId() {
  return require("crypto").randomUUID();
}

function normalizeValue(value, column) {
  if (column.type === "boolean") {
    return Boolean(value);
  }

  if (column.type === "integer") {
    const normalized = Number(value);

    if (!Number.isInteger(normalized)) {
      throw badRequest(`${column.name} debe ser un entero.`);
    }

    return normalized;
  }

  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return value;
}

function createCrudService(config) {
  const columnNames = config.columns.map((column) => column.name);
  const publicColumns = ["id", ...columnNames].join(", ");

  function buildPayload(body, { partial = false } = {}) {
    const payload = {};

    for (const column of config.columns) {
      if (!Object.prototype.hasOwnProperty.call(body, column.name)) {
        if (partial || column.default !== undefined || column.required !== true) {
          continue;
        }

        throw badRequest(`${column.name} es obligatorio.`);
      }

      const value = normalizeValue(body[column.name], column);

      if (value === undefined) {
        continue;
      }

      if (column.required && value === null) {
        throw badRequest(`${column.name} es obligatorio.`);
      }

      payload[column.name] = value;
    }

    return payload;
  }

  async function list(query = {}) {
    const search = typeof query.search === "string" ? query.search.trim() : "";

    if (search && config.searchColumns?.length) {
      const where = config.searchColumns
        .map((column, index) => `${column} ILIKE $${index + 1}`)
        .join(" OR ");
      const params = config.searchColumns.map(() => `%${search}%`);
      const result = await pool.query(
        `SELECT ${publicColumns} FROM ${config.table} WHERE ${where} ORDER BY ${config.orderBy}`,
        params,
      );

      return result.rows;
    }

    const result = await pool.query(
      `SELECT ${publicColumns} FROM ${config.table} ORDER BY ${config.orderBy}`,
    );

    return result.rows;
  }

  async function getById(id) {
    const result = await pool.query(
      `SELECT ${publicColumns} FROM ${config.table} WHERE id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  async function create(body) {
    const payload = buildPayload(body);
    const now = Date.now();
    const id = body.id || createId(config.idPrefix);
    const insertPayload = { id, ...payload };

    if (columnNames.includes("created_at") && insertPayload.created_at === undefined) {
      insertPayload.created_at = now;
    }

    if (columnNames.includes("updated_at") && insertPayload.updated_at === undefined) {
      insertPayload.updated_at = now;
    }

    const columns = Object.keys(insertPayload);
    const params = columns.map((column) => insertPayload[column]);
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    const result = await pool.query(
      `INSERT INTO ${config.table} (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       RETURNING ${publicColumns}`,
      params,
    );

    return result.rows[0];
  }

  async function update(id, body) {
    const payload = buildPayload(body, { partial: true });

    if (columnNames.includes("updated_at") && payload.updated_at === undefined) {
      payload.updated_at = Date.now();
    }

    const columns = Object.keys(payload);

    if (columns.length === 0) {
      return getById(id);
    }

    const params = columns.map((column) => payload[column]);
    params.push(id);

    const assignments = columns.map((column, index) => `${column} = $${index + 1}`);
    const result = await pool.query(
      `UPDATE ${config.table}
       SET ${assignments.join(", ")}
       WHERE id = $${params.length}
       RETURNING ${publicColumns}`,
      params,
    );

    return result.rows[0] || null;
  }

  async function remove(id) {
    const result = await pool.query(
      `DELETE FROM ${config.table} WHERE id = $1 RETURNING ${publicColumns}`,
      [id],
    );

    return result.rows[0] || null;
  }

  return {
    create,
    getById,
    list,
    remove,
    update,
  };
}

module.exports = {
  createCrudService,
};
