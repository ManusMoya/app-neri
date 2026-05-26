import type { Provider } from "@/database/schema";
import type { ProviderFormValues } from "@/modules/providers/types";
import { buildWhatsappLink, normalizePhone } from "@/modules/clients/utils/phone";
import { createId } from "@/utils/ids";
import { apiRequest, fromTimestamp } from "./api-client";

export interface ProviderDetails {
  provider: Provider;
  products: ProviderProductSummary[];
  productsCount: number;
  purchasesCount: number;
}

export interface ProviderProductSummary {
  id: string;
  name: string;
  description: string | null;
  stockTotal: number;
}

type ProviderRow = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp_link: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: number | string;
  updated_at: number | string;
};

function nullableText(value?: string | null) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function mapProvider(row: ProviderRow): Provider {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    whatsappLink: row.whatsapp_link,
    email: row.email,
    address: row.address,
    notes: row.notes,
    createdAt: fromTimestamp(row.created_at),
    updatedAt: fromTimestamp(row.updated_at),
  };
}

function toProviderPayload(values: ProviderFormValues) {
  const phone = normalizePhone(values.phone);
  return {
    name: values.name.trim(),
    phone,
    whatsapp_link: buildWhatsappLink(phone),
    email: nullableText(values.email),
    address: nullableText(values.address),
    notes: nullableText(values.notes),
  };
}

export async function listProviders(searchTerm = "") {
  const query = searchTerm.trim() ? `?search=${encodeURIComponent(searchTerm.trim())}` : "";
  const rows = await apiRequest<ProviderRow[]>(`/providers${query}`);
  return rows.map(mapProvider);
}

export async function getProviderDetails(id: string): Promise<ProviderDetails | null> {
  try {
    const row = await apiRequest<ProviderRow>(`/providers/${encodeURIComponent(id)}`);
    return {
      provider: mapProvider(row),
      products: [],
      productsCount: 0,
      purchasesCount: 0,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "Proveedor no encontrado.") {
      return null;
    }
    throw error;
  }
}

export async function createProviderFromForm(values: ProviderFormValues) {
  const row = await apiRequest<ProviderRow>("/providers", {
    method: "POST",
    body: JSON.stringify({ id: createId("provider"), ...toProviderPayload(values) }),
  });
  return mapProvider(row);
}

export async function updateProviderFromForm(id: string, values: ProviderFormValues) {
  const row = await apiRequest<ProviderRow>(`/providers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(toProviderPayload(values)),
  });
  return mapProvider(row);
}

export async function removeProvider(id: string) {
  const row = await apiRequest<ProviderRow>(`/providers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return mapProvider(row);
}
