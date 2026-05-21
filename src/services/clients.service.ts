import {
  createClient,
  getClientById,
  getClientOrderSummary,
  searchClients,
  updateClient,
} from "@/database/repositories";
import type { Client } from "@/database/schema";
import { createId } from "@/utils/ids";

import { buildWhatsappLink, normalizePhone } from "@/modules/clients/utils/phone";
import type { ClientFormValues } from "@/modules/clients/types";

export interface ClientDetails {
  client: Client;
  debt: number;
  ordersCount: number;
}

function toClientPayload(values: ClientFormValues) {
  const phone = normalizePhone(values.phone);

  return {
    name: values.name.trim(),
    phone,
    whatsappLink: buildWhatsappLink(phone),
  };
}

export async function listClients(searchTerm = "") {
  return searchClients(searchTerm);
}

export async function getClientDetails(id: string): Promise<ClientDetails | null> {
  const client = getClientById(id);

  if (!client) {
    return null;
  }

  const summary = getClientOrderSummary(id);

  return {
    client,
    debt: summary.debt,
    ordersCount: summary.ordersCount,
  };
}

export async function createClientFromForm(values: ClientFormValues) {
  return createClient({
    id: createId("client"),
    ...toClientPayload(values),
  });
}

export async function updateClientFromForm(id: string, values: ClientFormValues) {
  return updateClient(id, toClientPayload(values));
}
