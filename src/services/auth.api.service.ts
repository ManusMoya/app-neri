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

let currentSession: AuthApiSession | null = null;

export function getCurrentApiSession() {
  return currentSession;
}

export function logoutApiUser() {
  currentSession = null;
  setApiAuthToken(null);
  setCurrentUser(null);
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

export async function register(username: string, password: string) {
  const session = await apiRequest<AuthApiSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify(toCredentialsPayload(username, password)),
  });

  return setSession(session);
}

export async function login(username: string, password: string) {
  const session = await apiRequest<AuthApiSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify(toCredentialsPayload(username, password)),
  });

  return setSession(session);
}

export async function getMe() {
  return apiRequest<AuthApiUser>("/auth/me");
}
