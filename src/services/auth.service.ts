import { getSQLiteConnection } from "@/database";
import { createId } from "@/utils/ids";

export type AuthUser = {
  id: string;
  username: string;
  createdAt: Date;
};

const DEFAULT_USER = {
  id: "user_neri",
  username: "nerinamartinez",
  password: "neri123",
};

let currentUser: AuthUser | null = null;

type UserRow = {
  id: string;
  username: string;
  password: string;
  created_at: number;
  updated_at: number;
};

function mapUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    username: row.username,
    createdAt: new Date(row.created_at),
  };
}

export function getCurrentUser() {
  return currentUser;
}

export function setCurrentUser(user: AuthUser | null) {
  currentUser = user;
}

export function logoutUser() {
  currentUser = null;
}

export function requireCurrentUser() {
  if (!currentUser) {
    throw new Error("Inicia sesion para ver tus datos.");
  }

  return currentUser;
}

export async function ensureDefaultUser() {
  const sqlite = await getSQLiteConnection();
  const now = Date.now();

  await sqlite.runAsync(
    `insert or ignore into users (id, username, password, created_at, updated_at)
    values (?, ?, ?, ?, ?)`,
    DEFAULT_USER.id,
    DEFAULT_USER.username,
    DEFAULT_USER.password,
    now,
    now,
  );
}

export async function loginUser(username: string, password: string) {
  await ensureDefaultUser();

  const sqlite = await getSQLiteConnection();
  const normalizedUsername = username.trim();
  const row = await sqlite.getFirstAsync<UserRow>(
    "select * from users where username = ? and password = ?",
    normalizedUsername,
    password,
  );

  if (!row) {
    throw new Error("Usuario o contraseña incorrectos.");
  }

  currentUser = mapUser(row);
  return currentUser;
}

export async function createUser(username: string, password: string) {
  await ensureDefaultUser();

  const normalizedUsername = username.trim();
  const normalizedPassword = password.trim();

  if (!normalizedUsername) {
    throw new Error("Ingresa un usuario.");
  }

  if (!normalizedPassword) {
    throw new Error("Ingresa una contraseña.");
  }

  const sqlite = await getSQLiteConnection();
  const existing = await sqlite.getFirstAsync<{ id: string }>(
    "select id from users where username = ?",
    normalizedUsername,
  );

  if (existing) {
    throw new Error("Ese usuario ya existe.");
  }

  const now = Date.now();
  const id = createId("user");

  await sqlite.runAsync(
    `insert into users (id, username, password, created_at, updated_at)
    values (?, ?, ?, ?, ?)`,
    id,
    normalizedUsername,
    normalizedPassword,
    now,
    now,
  );

  currentUser = {
    id,
    username: normalizedUsername,
    createdAt: new Date(now),
  };

  return currentUser;
}
