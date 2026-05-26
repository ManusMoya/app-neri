import { API_BASE_URL } from "@/config/api";

type ApiResponse<T> = {
  status: "ok" | "error";
  data?: T;
  message?: string;
};

let authToken: string | null = null;

function buildApiUrl(path: string) {
  return new URL(path, API_BASE_URL).toString();
}

export function setApiAuthToken(token: string | null) {
  authToken = token;
}

export function getApiAuthToken() {
  return authToken;
}

export async function apiRequest<T>(path: string, init?: RequestInit) {
  const url = buildApiUrl(path);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...init,
    headers: {
      ...headers,
      ...init?.headers,
    },
  });
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    const text = await response.text();
    const preview = text.trim().slice(0, 120);
    throw new Error(
      `La API devolvio una respuesta que no es JSON para ${url}. ` +
        `Estado ${response.status}. ${preview || "Respuesta vacia."}`,
    );
  }

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
