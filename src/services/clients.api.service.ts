import type { Client } from "@/database/schema";
import type { ClientFormValues } from "@/modules/clients/types";
import { buildWhatsappLink, normalizePhone } from "@/modules/clients/utils/phone";
import { createId } from "@/utils/ids";
import { apiRequest, fromTimestamp } from "./api-client";

export interface ClientDetails {
  client: Client;
  debt: number;
  ordersCount: number;
  orders: ClientOrderHistoryItem[];
}

export interface ClientOrderHistoryItem {
  id: string;
  status: "draft" | "reserved" | "confirmed" | "delivered" | "cancelled";
  paymentStatus: "unpaid" | "partial" | "paid" | "refunded";
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  orderedAt: Date;
}

type ApiClientRow = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp_link: string | null;
  debt: number;
  created_at: number | string;
};

function mapClientRow(row: ApiClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    whatsappLink: row.whatsapp_link,
    debt: row.debt,
    createdAt: fromTimestamp(row.created_at),
  };
}

function toClientPayload(values: ClientFormValues) {
  const phone = normalizePhone(values.phone);

  return {
    name: values.name.trim(),
    phone,
    whatsapp_link: buildWhatsappLink(phone),
  };
}

export async function listClients(searchTerm = "") {
  const query = searchTerm.trim()
    ? `?search=${encodeURIComponent(searchTerm.trim())}`
    : "";
  const rows = await apiRequest<ApiClientRow[]>(`/clients${query}`);

  return rows.map(mapClientRow);
}

export async function getClientDetails(id: string): Promise<ClientDetails | null> {
  try {
    const row = await apiRequest<ApiClientRow>(`/clients/${encodeURIComponent(id)}`);
    const client = mapClientRow(row);

    return {
      client,
      debt: client.debt,
      ordersCount: 0,
      orders: [],
    };
  } catch (error) {
    if (error instanceof Error && error.message === "Cliente no encontrado.") {
      return null;
    }

    throw error;
  }
}

export async function createClientFromForm(values: ClientFormValues) {
  const row = await apiRequest<ApiClientRow>("/clients", {
    method: "POST",
    body: JSON.stringify({
      id: createId("client"),
      ...toClientPayload(values),
    }),
  });

  return mapClientRow(row);
}

export async function updateClientFromForm(id: string, values: ClientFormValues) {
  const row = await apiRequest<ApiClientRow>(`/clients/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(toClientPayload(values)),
  });

  return mapClientRow(row);
}

export async function deleteClient(id: string) {
  const row = await apiRequest<ApiClientRow>(`/clients/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  return mapClientRow(row);
}
