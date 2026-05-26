import { getSQLiteConnection } from "@/database";
import type { Client } from "@/database/schema";
import { createId } from "@/utils/ids";
import { requireCurrentUser } from "./auth.service";

import { buildWhatsappLink, normalizePhone } from "@/modules/clients/utils/phone";
import type { ClientFormValues } from "@/modules/clients/types";

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

type ClientRow = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp_link: string | null;
  debt: number;
  created_at: number;
};

type ClientOrderRow = {
  id: string;
  status: ClientOrderHistoryItem["status"];
  payment_status: ClientOrderHistoryItem["paymentStatus"];
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  ordered_at: number;
};

function mapClientRow(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    whatsappLink: row.whatsapp_link,
    debt: row.debt,
    createdAt: new Date(row.created_at),
  };
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
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const normalized = searchTerm.trim();

  if (!normalized) {
    const rows = await sqlite.getAllAsync<ClientRow>(
      "select * from clients where user_id = ? order by created_at desc",
      user.id,
    );

    return rows.map(mapClientRow);
  }

  const pattern = `%${normalized}%`;
  const rows = await sqlite.getAllAsync<ClientRow>(
    `select * from clients
    where user_id = ? and (name like ? or phone like ?)
    order by created_at desc`,
    user.id,
    pattern,
    pattern,
  );

  return rows.map(mapClientRow);
}

export async function getClientDetails(id: string): Promise<ClientDetails | null> {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const clientRow = await sqlite.getFirstAsync<ClientRow>(
    "select * from clients where id = ? and user_id = ?",
    id,
    user.id,
  );

  if (!clientRow) {
    return null;
  }

  const client = mapClientRow(clientRow);
  const summary = await sqlite.getFirstAsync<{ debt: number; orders_count: number }>(
    `select coalesce(sum(balance_due), 0) as debt, count(id) as orders_count
    from orders
    where client_id = ? and user_id = ? and status != 'cancelled'`,
    id,
    user.id,
  );
  const orderRows = await sqlite.getAllAsync<ClientOrderRow>(
    `select id, status, payment_status, total_amount, paid_amount, balance_due, ordered_at
    from orders
    where client_id = ? and user_id = ?
    order by ordered_at desc`,
    id,
    user.id,
  );

  return {
    client,
    debt: summary?.debt ?? 0,
    ordersCount: summary?.orders_count ?? 0,
    orders: orderRows.map((order) => ({
      id: order.id,
      status: order.status,
      paymentStatus: order.payment_status,
      totalAmount: order.total_amount,
      paidAmount: order.paid_amount,
      balanceDue: order.balance_due,
      orderedAt: new Date(order.ordered_at),
    })),
  };
}

export async function createClientFromForm(values: ClientFormValues) {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const id = createId("client");
  const payload = toClientPayload(values);
  const now = Date.now();

  await sqlite.runAsync(
    `insert into clients (id, user_id, name, phone, whatsapp_link, debt, created_at)
    values (?, ?, ?, ?, ?, 0, ?)`,
    id,
    user.id,
    payload.name,
    payload.phone,
    payload.whatsappLink,
    now,
  );

  const row = await sqlite.getFirstAsync<ClientRow>(
    "select * from clients where id = ? and user_id = ?",
    id,
    user.id,
  );

  if (!row) {
    throw new Error("No se pudo cargar el cliente creado.");
  }

  return mapClientRow(row);
}

export async function updateClientFromForm(id: string, values: ClientFormValues) {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const payload = toClientPayload(values);

  await sqlite.runAsync(
    "update clients set name = ?, phone = ?, whatsapp_link = ? where id = ? and user_id = ?",
    payload.name,
    payload.phone,
    payload.whatsappLink,
    id,
    user.id,
  );

  const row = await sqlite.getFirstAsync<ClientRow>(
    "select * from clients where id = ? and user_id = ?",
    id,
    user.id,
  );

  if (!row) {
    throw new Error("Cliente no encontrado.");
  }

  return mapClientRow(row);
}
