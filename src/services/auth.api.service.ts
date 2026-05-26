import { apiRequest, setApiAuthToken } from "./api-client";

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

let currentSession: AuthApiSession | null = null;

export function getCurrentApiSession() {
  return currentSession;
}

export function logoutApiUser() {
  currentSession = null;
  setApiAuthToken(null);
}

function setSession(session: AuthApiSession) {
  currentSession = session;
  setApiAuthToken(session.token);
  return session;
}

export async function register(username: string, password: string) {
  const session = await apiRequest<AuthApiSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  return setSession(session);
}

export async function login(username: string, password: string) {
  const session = await apiRequest<AuthApiSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  return setSession(session);
}

export async function getMe() {
  return apiRequest<AuthApiUser>("/auth/me");
}
