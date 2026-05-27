const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { getJwtSecret } = require("../middleware/auth.middleware");

function publicUser(row) {
  return {
    id: String(row.id),
    username: row.username,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function signUser(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
    },
    getJwtSecret(),
    { expiresIn: "7d" },
  );
}

function normalizeCredentials({ username, password }) {
  const normalizedUsername = typeof username === "string" ? username.trim() : "";
  const normalizedPassword = typeof password === "string" ? password : "";

  if (!normalizedUsername) {
    const error = new Error("El usuario es obligatorio.");
    error.statusCode = 400;
    throw error;
  }

  if (normalizedPassword.length < 6) {
    const error = new Error("La contrasena debe tener al menos 6 caracteres.");
    error.statusCode = 400;
    throw error;
  }

  return {
    username: normalizedUsername,
    password: normalizedPassword,
  };
}

function authSchemaError(error) {
  if (error.code === "42703") {
    const schemaError = new Error(
      "La tabla users necesita la columna password_hash. Ejecuta: ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;",
    );
    schemaError.statusCode = 500;
    return schemaError;
  }

  return error;
}

async function register(input) {
  const { username, password } = normalizeCredentials(input);
  const passwordHash = await bcrypt.hash(password, 12);
  const now = Date.now();

  try {
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, updated_at)
       VALUES ($1, $2, $3)
       RETURNING id, username, created_at, updated_at`,
      [username, passwordHash, now],
    );
    const user = publicUser(result.rows[0]);

    return {
      token: signUser(user),
      user,
    };
  } catch (error) {
    if (error.code === "23505") {
      const duplicate = new Error("Ese usuario ya existe.");
      duplicate.statusCode = 409;
      throw duplicate;
    }

    throw authSchemaError(error);
  }
}

async function login(input) {
  const { username, password } = normalizeCredentials(input);

  try {
    const result = await pool.query(
      "SELECT id, username, password_hash, created_at, updated_at FROM users WHERE username = $1",
      [username],
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash || ""))) {
      const error = new Error("Usuario o contrasena incorrectos.");
      error.statusCode = 401;
      throw error;
    }

    const safeUser = publicUser(user);

    return {
      token: signUser(safeUser),
      user: safeUser,
    };
  } catch (error) {
    throw authSchemaError(error);
  }
}

async function getMe(userId) {
  const result = await pool.query(
    "SELECT id, username, created_at, updated_at FROM users WHERE id = $1",
    [userId],
  );

  return result.rows[0] ? publicUser(result.rows[0]) : null;
}

module.exports = {
  getMe,
  login,
  register,
};
