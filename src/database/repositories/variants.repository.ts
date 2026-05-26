import { and, eq, gte, sql } from "drizzle-orm";

import { getDatabaseSync } from "../drizzle";
import { productVariants, type NewProductVariant } from "../schema";
import type { RepositoryDatabase } from "./types";

export type CreateVariantInput = NewProductVariant;
export type UpdateVariantInput = Partial<Omit<NewProductVariant, "id" | "productId" | "createdAt">>;

export function createVariant(input: CreateVariantInput, db: RepositoryDatabase = getDatabaseSync()) {
  return db.insert(productVariants).values(input).returning().get();
}

export function updateVariant(
  id: string,
  input: UpdateVariantInput,
  db: RepositoryDatabase = getDatabaseSync(),
) {
  return db
    .update(productVariants)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(productVariants.id, id))
    .returning()
    .get();
}

export async function updateVariantStock(
  id: string,
  stock: number,
  db: RepositoryDatabase = getDatabaseSync(),
) {
  const result = await db
    .update(productVariants)
    .set({ stock, updatedAt: new Date() })
    .where(eq(productVariants.id, id))
    .returning();
  return result[0];
}

export async function reserveStock(
  id: string,
  quantity: number,
  db: RepositoryDatabase = getDatabaseSync(),
) {
  const result = await db
    .update(productVariants)
    .set({
      reservedStock: sql`${productVariants.reservedStock} + ${quantity}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(productVariants.id, id),
        gte(sql<number>`${productVariants.stock} - ${productVariants.reservedStock}`, quantity),
      ),
    )
    .returning();
  return result[0];
}

export async function releaseReservedStock(
  id: string,
  quantity: number,
  db: RepositoryDatabase = getDatabaseSync(),
) {
  const result = await db
    .update(productVariants)
    .set({
      reservedStock: sql`case when ${productVariants.reservedStock} - ${quantity} < 0 then 0 else ${productVariants.reservedStock} - ${quantity} end`,
      updatedAt: new Date(),
    })
    .where(eq(productVariants.id, id))
    .returning();
  return result[0];
}

export async function decrementStock(
  id: string,
  quantity: number,
  db: RepositoryDatabase = getDatabaseSync(),
) {
  const result = await db
    .update(productVariants)
    .set({
      stock: sql`${productVariants.stock} - ${quantity}`,
      updatedAt: new Date(),
    })
    .where(and(eq(productVariants.id, id), gte(productVariants.stock, quantity)))
    .returning();
  return result[0];
}
