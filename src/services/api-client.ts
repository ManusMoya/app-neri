import { API_BASE_URL } from "@/config/api";

type ApiResponse<T> = {
  status: "ok" | "error";
  data?: T;
  message?: string;
};

let authToken: string | null = null;

export function setApiAuthToken(token: string | null) {
  authToken = token;
}

export function getApiAuthToken() {
  return authToken;
}

export async function apiRequest<T>(path: string, init?: RequestInit) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...init?.headers,
    },
  });
  const body = await response.json() as ApiResponse<T>;

  if (!response.ok || body.status === "error") {
    throw new Error(body.message || "No se pudo completar la solicitud.");
  }

  if (body.data === undefined) {
    throw new Error("La API no devolvio datos.");
  }

  return body.data;
}

export function toTimestamp(value?: Date | number | null) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return value instanceof Date ? value.getTime() : value;
}

export function fromTimestamp(value: number | string | Date) {
  return value instanceof Date ? value : new Date(Number(value));
}
