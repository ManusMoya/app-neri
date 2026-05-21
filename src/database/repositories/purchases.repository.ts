import { eq } from "drizzle-orm";

import { getDatabaseSync } from "../drizzle";
import { purchaseItems, purchases, type NewPurchase, type NewPurchaseItem } from "../schema";
import type { RepositoryDatabase } from "./types";

export type CreatePurchaseInput = NewPurchase;
export type RegisterPurchaseItemInput = NewPurchaseItem;

export function createPurchase(
  input: CreatePurchaseInput,
  db: RepositoryDatabase = getDatabaseSync(),
) {
  return db.insert(purchases).values(input).returning().get();
}

export function registerPurchaseItems(
  items: RegisterPurchaseItemInput[],
  db: RepositoryDatabase = getDatabaseSync(),
) {
  if (items.length === 0) {
    return [];
  }

  return db.insert(purchaseItems).values(items).returning().all();
}

export function getPurchaseById(id: string, db: RepositoryDatabase = getDatabaseSync()) {
  return db.query.purchases.findFirst({
    where: eq(purchases.id, id),
    with: {
      provider: true,
      items: true,
    },
  }).sync();
}
