import { desc, eq, like, or } from "drizzle-orm";

import { getDatabaseSync } from "../drizzle";
import {
  categories,
  productVariants,
  products,
  providers,
  type NewProduct,
  type NewProductVariant,
  type Product,
  type ProductVariant,
} from "../schema";
import type { RepositoryDatabase } from "./types";

export type CreateProductInput = NewProduct;
export type UpdateProductInput = Partial<Omit<NewProduct, "id" | "createdAt">>;
export type UpsertCategoryInput = Pick<typeof categories.$inferInsert, "id" | "name" | "description">;
export type UpsertProviderInput = Pick<typeof providers.$inferInsert, "id" | "name">;

export function createProduct(input: CreateProductInput, db: RepositoryDatabase = getDatabaseSync()) {
  return db.insert(products).values(input).returning().get();
}

export function updateProduct(
  id: string,
  input: UpdateProductInput,
  db: RepositoryDatabase = getDatabaseSync(),
) {
  return db
    .update(products)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning()
    .get();
}

export function getProducts(db: RepositoryDatabase = getDatabaseSync()): Product[] {
  return db.select().from(products).orderBy(desc(products.createdAt)).all();
}

export function getProductById(id: string, db: RepositoryDatabase = getDatabaseSync()) {
  const rows = db
    .select({
      product: products,
      variant: productVariants,
      category: categories,
      provider: providers,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(providers, eq(products.providerId, providers.id))
    .leftJoin(productVariants, eq(products.id, productVariants.productId))
    .where(eq(products.id, id))
    .all();

  if (rows.length === 0) return null;

  const result = {
    ...rows[0].product,
    category: rows[0].category,
    provider: rows[0].provider,
    variants: rows
      .map((r) => r.variant)
      .filter((v): v is ProductVariant => v !== null && v.isActive),
  };

  return result;
}

export function getProductsWithDetails(db: RepositoryDatabase = getDatabaseSync()) {
  const rows = db
    .select({
      product: products,
      variant: productVariants,
      category: categories,
      provider: providers,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(providers, eq(products.providerId, providers.id))
    .leftJoin(productVariants, eq(products.id, productVariants.productId))
    .orderBy(desc(products.createdAt))
    .all();

  const productMap = new Map<string, any>();

  for (const row of rows) {
    if (!productMap.has(row.product.id)) {
      productMap.set(row.product.id, {
        ...row.product,
        category: row.category,
        provider: row.provider,
        variants: [],
      });
    }

    if (row.variant && row.variant.isActive) {
      productMap.get(row.product.id).variants.push(row.variant);
    }
  }

  return Array.from(productMap.values());
}

export function getVariantsByProduct(
  productId: string,
  db: RepositoryDatabase = getDatabaseSync(),
): ProductVariant[] {
  return db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .orderBy(desc(productVariants.createdAt))
    .all();
}

export function searchProducts(
  searchTerm: string,
  db: RepositoryDatabase = getDatabaseSync(),
): Product[] {
  const normalized = searchTerm.trim();

  if (!normalized) {
    return getProducts(db);
  }

  const pattern = `%${normalized}%`;

  return db
    .select()
    .from(products)
    .where(or(like(products.name, pattern), like(products.description, pattern)))
    .orderBy(desc(products.createdAt))
    .all();
}

export function getCategories(db: RepositoryDatabase = getDatabaseSync()) {
  return db.select().from(categories).orderBy(categories.name).all();
}

export function getProviders(db: RepositoryDatabase = getDatabaseSync()) {
  return db.select().from(providers).orderBy(providers.name).all();
}

export function getCategoryByName(name: string, db: RepositoryDatabase = getDatabaseSync()) {
  return db.select().from(categories).where(eq(categories.name, name)).get();
}

export function getProviderByName(name: string, db: RepositoryDatabase = getDatabaseSync()) {
  return db.select().from(providers).where(eq(providers.name, name)).get();
}

export function createCategory(input: UpsertCategoryInput, db: RepositoryDatabase = getDatabaseSync()) {
  return db.insert(categories).values(input).returning().get();
}

export function createProvider(input: UpsertProviderInput, db: RepositoryDatabase = getDatabaseSync()) {
  return db.insert(providers).values(input).returning().get();
}

export function replaceProductVariants(
  productId: string,
  variants: NewProductVariant[],
  db: RepositoryDatabase = getDatabaseSync(),
) {
  db.delete(productVariants).where(eq(productVariants.productId, productId)).run();

  if (variants.length === 0) {
    return [];
  }

  return db.insert(productVariants).values(variants).returning().all();
}
