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
  const tableAlias = "entity";

  function scopedSelectFrom() {
    if (config.userScoped) {
      return `${config.table} ${tableAlias}`;
    }

    if (config.owner) {
      return `${config.table} ${tableAlias}
        INNER JOIN ${config.owner.table} ${config.owner.alias}
          ON ${config.owner.alias}.${config.owner.idColumn} = ${tableAlias}.${config.owner.localColumn}`;
    }

    return `${config.table} ${tableAlias}`;
  }

  function scopedPublicColumns() {
    return ["id", ...columnNames].map((column) => `${tableAlias}.${column}`).join(", ");
  }

  function scopeWhere(userId, startIndex = 1) {
    if (config.userScoped) {
      return {
        clause: `${tableAlias}.user_id = $${startIndex}`,
        params: [userId],
        nextIndex: startIndex + 1,
      };
    }

    if (config.owner) {
      return {
        clause: `${config.owner.alias}.user_id = $${startIndex}`,
        params: [userId],
        nextIndex: startIndex + 1,
      };
    }

    return {
      clause: "TRUE",
      params: [],
      nextIndex: startIndex,
    };
  }

  function mutationScopeWhere(userId, startIndex) {
    if (config.userScoped) {
      return {
        clause: `${tableAlias}.user_id = $${startIndex}`,
        params: [userId],
      };
    }

    if (config.owner) {
      return {
        clause: `EXISTS (
          SELECT 1 FROM ${config.owner.table} ${config.owner.alias}
          WHERE ${config.owner.alias}.${config.owner.idColumn} = ${tableAlias}.${config.owner.localColumn}
            AND ${config.owner.alias}.user_id = $${startIndex}
        )`,
        params: [userId],
      };
    }

    return {
      clause: "TRUE",
      params: [],
    };
  }

  async function validateScopedReferences(payload, userId) {
    for (const reference of config.scopedReferences ?? []) {
      const value = payload[reference.column];

      if (!value) {
        continue;
      }

      const result = await pool.query(
        `SELECT id FROM ${reference.table} WHERE id = $1 AND user_id = $2`,
        [value, userId],
      );

      if (!result.rows[0]) {
        throw badRequest(`${reference.column} no pertenece al usuario actual.`);
      }
    }
  }

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

  async function list(query = {}, userId) {
    const search = typeof query.search === "string" ? query.search.trim() : "";
    const scope = scopeWhere(userId);
    const params = [...scope.params];
    const whereParts = [scope.clause];

    if (search && config.searchColumns?.length) {
      const where = config.searchColumns
        .map((column, index) => `${tableAlias}.${column} ILIKE $${scope.nextIndex + index}`)
        .join(" OR ");
      whereParts.push(`(${where})`);
      params.push(...config.searchColumns.map(() => `%${search}%`));
    }

    const result = await pool.query(
      `SELECT ${scopedPublicColumns()}
       FROM ${scopedSelectFrom()}
       WHERE ${whereParts.join(" AND ")}
       ORDER BY ${tableAlias}.${config.orderBy}`,
      params,
    );

    return result.rows;
  }

  async function getById(id, userId) {
    const scope = scopeWhere(userId, 2);
    const result = await pool.query(
      `SELECT ${scopedPublicColumns()}
       FROM ${scopedSelectFrom()}
       WHERE ${tableAlias}.id = $1 AND ${scope.clause}`,
      [id, ...scope.params],
    );

    return result.rows[0] || null;
  }

  async function create(body, userId) {
    const payload = buildPayload(body);
    await validateScopedReferences(payload, userId);

    const now = Date.now();
    const id = body.id || createId(config.idPrefix);
    const insertPayload = { id, ...payload };

    if (config.userScoped) {
      insertPayload.user_id = userId;
    }

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

  async function update(id, body, userId) {
    const payload = buildPayload(body, { partial: true });
    await validateScopedReferences(payload, userId);

    if (columnNames.includes("updated_at") && payload.updated_at === undefined) {
      payload.updated_at = Date.now();
    }

    const columns = Object.keys(payload);

    if (columns.length === 0) {
      return getById(id, userId);
    }

    const params = columns.map((column) => payload[column]);
    params.push(id);
    const scope = mutationScopeWhere(userId, params.length + 1);
    params.push(...scope.params);

    const assignments = columns.map((column, index) => `${column} = $${index + 1}`);
    const result = await pool.query(
      `UPDATE ${config.table} ${tableAlias}
       SET ${assignments.join(", ")}
       WHERE ${tableAlias}.id = $${columns.length + 1}
         AND ${scope.clause}
       RETURNING ${publicColumns}`,
      params,
    );

    return result.rows[0] || null;
  }

  async function remove(id, userId) {
    const scope = mutationScopeWhere(userId, 2);
    const result = await pool.query(
      `DELETE FROM ${config.table} ${tableAlias}
       WHERE ${tableAlias}.id = $1 AND ${scope.clause}
       RETURNING ${publicColumns}`,
      [id, ...scope.params],
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
