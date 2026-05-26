import { desc, eq, like, or, sql } from "drizzle-orm";

import { getDatabaseSync } from "../drizzle";
import { products, providers, purchases, type NewProvider, type Provider } from "../schema";
import type { RepositoryDatabase } from "./types";

export type CreateProviderInput = NewProvider;
export type UpdateProviderInput = Partial<Omit<NewProvider, "id" | "createdAt">>;

export function createProviderRecord(
  input: CreateProviderInput,
  db: RepositoryDatabase = getDatabaseSync(),
) {
  return db.insert(providers).values(input).returning().get();
}

export function updateProviderRecord(
  id: string,
  input: UpdateProviderInput,
  db: RepositoryDatabase = getDatabaseSync(),
) {
  return db.update(providers).set(input).where(eq(providers.id, id)).returning().get();
}

export function deleteProviderRecord(id: string, db: RepositoryDatabase = getDatabaseSync()) {
  return db.delete(providers).where(eq(providers.id, id)).returning().get();
}

export function getProviderRecordById(id: string, db: RepositoryDatabase = getDatabaseSync()) {
  return db.query.providers.findFirst({
    where: eq(providers.id, id),
  }).sync();
}

export function searchProviders(
  searchTerm: string,
  db: RepositoryDatabase = getDatabaseSync(),
): Provider[] {
  const normalized = searchTerm.trim();

  if (!normalized) {
    return db.select().from(providers).orderBy(desc(providers.createdAt)).all();
  }

  const pattern = `%${normalized}%`;

  return db
    .select()
    .from(providers)
    .where(or(like(providers.name, pattern), like(providers.phone, pattern), like(providers.email, pattern)))
    .orderBy(desc(providers.createdAt))
    .all();
}

export function getProviderUsage(providerId: string, db: RepositoryDatabase = getDatabaseSync()) {
  const [productsResult] = db
    .select({ count: sql<number>`count(${products.id})` })
    .from(products)
    .where(eq(products.providerId, providerId))
    .all();

  const [purchasesResult] = db
    .select({ count: sql<number>`count(${purchases.id})` })
    .from(purchases)
    .where(eq(purchases.providerId, providerId))
    .all();

  return {
    productsCount: productsResult?.count ?? 0,
    purchasesCount: purchasesResult?.count ?? 0,
  };
}
