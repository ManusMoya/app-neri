import { and, desc, eq, like, or, sql } from "drizzle-orm";

import { getDatabaseSync } from "../drizzle";
import { clients, orders, type Client, type NewClient } from "../schema";
import type { RepositoryDatabase } from "./types";

export type CreateClientInput = NewClient;
export type UpdateClientInput = Partial<Omit<NewClient, "id" | "createdAt">>;

export function createClient(input: CreateClientInput, db: RepositoryDatabase = getDatabaseSync()) {
  return db.insert(clients).values(input).returning().get();
}

export function updateClient(
  id: string,
  input: UpdateClientInput,
  db: RepositoryDatabase = getDatabaseSync(),
) {
  return db.update(clients).set(input).where(eq(clients.id, id)).returning().get();
}

export function getClientById(id: string, db: RepositoryDatabase = getDatabaseSync()) {
  return db.query.clients.findFirst({
    where: eq(clients.id, id),
  }).sync();
}

export function searchClients(
  searchTerm: string,
  db: RepositoryDatabase = getDatabaseSync(),
): Client[] {
  const normalized = searchTerm.trim();

  if (!normalized) {
    return db.select().from(clients).orderBy(desc(clients.createdAt)).all();
  }

  const pattern = `%${normalized}%`;

  return db
    .select()
    .from(clients)
    .where(or(like(clients.name, pattern), like(clients.phone, pattern)))
    .orderBy(desc(clients.createdAt))
    .all();
}

export function getClientDebt(clientId: string, db: RepositoryDatabase = getDatabaseSync()) {
  const [result] = db
    .select({
      debt: sql<number>`coalesce(sum(${orders.balanceDue}), 0)`,
    })
    .from(orders)
    .where(and(eq(orders.clientId, clientId), sql`${orders.status} != 'cancelled'`))
    .all();

  return result?.debt ?? 0;
}

export function getClientOrderSummary(
  clientId: string,
  db: RepositoryDatabase = getDatabaseSync(),
) {
  const [result] = db
    .select({
      ordersCount: sql<number>`count(${orders.id})`,
      debt: sql<number>`coalesce(sum(${orders.balanceDue}), 0)`,
    })
    .from(orders)
    .where(and(eq(orders.clientId, clientId), sql`${orders.status} != 'cancelled'`))
    .all();

  return {
    ordersCount: result?.ordersCount ?? 0,
    debt: result?.debt ?? 0,
  };
}
