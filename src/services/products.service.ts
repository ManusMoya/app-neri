import { eq } from "drizzle-orm";

import { getDatabase } from "@/database";
import {
  createCategory,
  createProduct,
  createProvider,
  getCategoryByName,
  getProductById,
  getProductsWithDetails,
  getProviderByName,
  updateProduct,
} from "@/database/repositories";
import { createVariant, updateVariant } from "@/database/repositories/variants.repository";
import {
  productVariants,
  type Category,
  type ProductVariant,
  type Provider,
} from "@/database/schema";
import { createId } from "@/utils/ids";
import type { RepositoryDatabase } from "@/database/repositories";

import type {
  ProductFormValues,
  ProductListRecord,
  ProductStockFilter,
  ProductVariantFormValues,
  ProductWithDetails,
} from "@/modules/products/types";
import {
  getProductMetrics,
  getStockStatus,
} from "@/modules/products/utils";

function cleanText(value?: string | null) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function toVariantPayload(productId: string, values: ProductVariantFormValues) {
  return {
    productId,
    color: cleanText(values.color),
    size: cleanText(values.size),
    model: cleanText(values.model),
    sku: cleanText(values.sku),
    barcode: cleanText(values.barcode),
    stock: values.stock,
    reservedStock: values.reservedStock,
    minimumStock: values.minimumStock,
    costPrice: values.costPrice,
    salePrice: values.salePrice,
    isActive: true,
  };
}

function toProductListItem(product: ProductWithDetails): ProductListRecord {
  return {
    ...product,
    ...getProductMetrics(product.variants),
  };
}

function matchesSearch(product: ProductWithDetails, searchTerm: string) {
  const normalized = searchTerm.trim().toLocaleLowerCase();

  if (!normalized) {
    return true;
  }

  return (
    product.name.toLocaleLowerCase().includes(normalized) ||
    (product.description?.toLocaleLowerCase().includes(normalized) ?? false) ||
    product.variants.some(
      (variant) =>
        variant.sku?.toLocaleLowerCase().includes(normalized) ||
        variant.barcode?.toLocaleLowerCase().includes(normalized),
    )
  );
}

function matchesStockFilter(product: ProductListRecord, filter: ProductStockFilter) {
  if (filter === "all") {
    return true;
  }

  const variants = product.variants.filter((variant) => variant.isActive);

  if (filter === "out") {
    return variants.length > 0 && variants.every((variant) => getStockStatus(variant) === "out");
  }

  return variants.some((variant) => getStockStatus(variant) === "low");
}

function getOrCreateCategory(name: string, tx: RepositoryDatabase) {
  const normalized = normalizeName(name);
  const existing = getCategoryByName(normalized, tx) as Category | undefined;

  if (existing) {
    return existing;
  }

  return createCategory({ id: createId("category"), name: normalized }, tx);
}

function getOrCreateProvider(name: string, tx: RepositoryDatabase) {
  const normalized = normalizeName(name);
  const existing = getProviderByName(normalized, tx) as Provider | undefined;

  if (existing) {
    return existing;
  }

  return createProvider({ id: createId("provider"), name: normalized }, tx);
}

export async function listProducts(searchTerm = "", filter: ProductStockFilter = "all") {
  const products = getProductsWithDetails() as ProductWithDetails[];

  return products
    .filter((product) => matchesSearch(product, searchTerm))
    .map(toProductListItem)
    .filter((product) => matchesStockFilter(product, filter));
}

export async function getProductDetails(id: string) {
  const product = getProductById(id) as ProductWithDetails | undefined;

  if (!product) {
    return null;
  }

  return toProductListItem(product);
}

export async function createProductFromForm(values: ProductFormValues) {
  const db = await getDatabase();

  return db.transaction((tx) => {
    const repositoryDb = tx as unknown as RepositoryDatabase;
    const category = getOrCreateCategory(values.categoryName, repositoryDb);
    const provider = getOrCreateProvider(values.providerName, repositoryDb);
    const productId = createId("product");

    const product = createProduct({
      id: productId,
      name: normalizeName(values.name),
      description: cleanText(values.description),
      categoryId: category.id,
      providerId: provider.id,
    }, repositoryDb);

    for (const variant of values.variants) {
      createVariant({
        id: createId("variant"),
        ...toVariantPayload(productId, variant),
      }, repositoryDb);
    }

    return product;
  });
}

export async function updateProductFromForm(id: string, values: ProductFormValues) {
  const db = await getDatabase();

  return db.transaction((tx) => {
    const repositoryDb = tx as unknown as RepositoryDatabase;
    const category = getOrCreateCategory(values.categoryName, repositoryDb);
    const provider = getOrCreateProvider(values.providerName, repositoryDb);

    const product = updateProduct(id, {
      name: normalizeName(values.name),
      description: cleanText(values.description),
      categoryId: category.id,
      providerId: provider.id,
    }, repositoryDb);

    const existingVariants = tx
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id))
      .all() as ProductVariant[];
    const submittedIds = new Set(values.variants.map((variant) => variant.id).filter(Boolean));

    for (const existingVariant of existingVariants) {
      if (!submittedIds.has(existingVariant.id)) {
        updateVariant(existingVariant.id, { isActive: false }, repositoryDb);
      }
    }

    for (const variant of values.variants) {
      if (variant.id) {
        updateVariant(variant.id, toVariantPayload(id, variant), repositoryDb);
      } else {
        createVariant({
          id: createId("variant"),
          ...toVariantPayload(id, variant),
        }, repositoryDb);
      }
    }

    return product;
  });
}
