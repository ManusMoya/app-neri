import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import { apiRequest, setApiAuthToken } from "./api-client";
import { setCurrentUser, type AuthUser } from "./auth.service";

export type AuthApiUser = {
  id: string;
  username: string;
  created_at: number;
  updated_at: number;
};

export type AuthApiSession = {
  token: string;
  user: AuthApiUser;
};

type AuthCredentialsPayload = {
  username: string;
  password: string;
};

type AuthOptions = {
  remember?: boolean;
};

const SESSION_STORAGE_KEY = "app_neri_session";

let currentSession: AuthApiSession | null = null;

export function getCurrentApiSession() {
  return currentSession;
}

async function getStoredSession() {
  const value = Platform.OS === "web"
    ? globalThis.localStorage?.getItem(SESSION_STORAGE_KEY) ?? null
    : await SecureStore.getItemAsync(SESSION_STORAGE_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthApiSession;
  } catch {
    await clearStoredSession();
    return null;
  }
}

async function saveStoredSession(session: AuthApiSession) {
  const value = JSON.stringify(session);

  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(SESSION_STORAGE_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(SESSION_STORAGE_KEY, value);
}

async function clearStoredSession() {
  if (Platform.OS === "web") {
    globalThis.localStorage?.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
}

export async function logoutApiUser() {
  currentSession = null;
  setApiAuthToken(null);
  setCurrentUser(null);
  await clearStoredSession();
}

function setSession(session: AuthApiSession) {
  currentSession = session;
  setApiAuthToken(session.token);
  setCurrentUser(mapApiUser(session.user));
  return session;
}

function mapApiUser(user: AuthApiUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    createdAt: new Date(Number(user.created_at)),
  };
}

function toCredentialsPayload(username: string, password: string): AuthCredentialsPayload {
  return {
    username,
    password,
  };
}

async function applyAuthResult(session: AuthApiSession, options?: AuthOptions) {
  setSession(session);

  if (options?.remember ?? true) {
    await saveStoredSession(session);
  } else {
    await clearStoredSession();
  }

  return session;
}

export async function restoreStoredSession() {
  const session = await getStoredSession();

  if (!session) {
    return null;
  }

  try {
    setApiAuthToken(session.token);
    const user = await getMe();
    return setSession({ token: session.token, user });
  } catch {
    currentSession = null;
    setApiAuthToken(null);
    setCurrentUser(null);
    await clearStoredSession();
    return null;
  }
}

export async function register(username: string, password: string, options?: AuthOptions) {
  const session = await apiRequest<AuthApiSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify(toCredentialsPayload(username, password)),
  });

  return applyAuthResult(session, options);
}

export async function login(username: string, password: string, options?: AuthOptions) {
  const session = await apiRequest<AuthApiSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify(toCredentialsPayload(username, password)),
  });

  return applyAuthResult(session, options);
}

export async function getMe() {
  return apiRequest<AuthApiUser>("/auth/me");
}
