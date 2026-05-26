import type { Category, Product, Provider } from "@/database/schema";
import type {
  ProductFormValues,
  ProductListRecord,
  ProductStockFilter,
  ProductWithDetails,
} from "@/modules/products/types";
import { getProductMetrics, getStockStatus } from "@/modules/products/utils";
import { createId } from "@/utils/ids";
import { apiRequest, fromTimestamp } from "./api-client";
import { listCategories } from "./categories.api.service";
import { listProviders } from "./providers.api.service";
import { listProductVariants } from "./product-variants.api.service";

type ProductRow = {
  id: string;
  category_id: string;
  provider_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: number | string;
  updated_at: number | string;
};

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    categoryId: row.category_id,
    providerId: row.provider_id,
    name: row.name,
    description: row.description,
    isActive: Boolean(row.is_active),
    createdAt: fromTimestamp(row.created_at),
    updatedAt: fromTimestamp(row.updated_at),
  };
}

function cleanText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

async function hydrateProduct(row: ProductRow): Promise<ProductWithDetails> {
  const [categories, providers, variants] = await Promise.all([
    listCategories(),
    listProviders(),
    listProductVariants(),
  ]);
  const product = mapProduct(row);
  const category = categories.find((item) => item.id === product.categoryId);
  const provider = providers.find((item) => item.id === product.providerId);

  if (!category || !provider) {
    throw new Error("No se pudieron cargar las relaciones del producto.");
  }

  return {
    ...product,
    category: category as Category,
    provider: provider as Provider,
    variants: variants.filter((variant) => variant.productId === product.id && variant.isActive),
  };
}

function toProductListItem(product: ProductWithDetails): ProductListRecord {
  return {
    ...product,
    ...getProductMetrics(product.variants),
  };
}

function matchesStockFilter(product: ProductListRecord, filter: ProductStockFilter) {
  if (filter === "all") {
    return true;
  }

  const variants = product.variants.filter((variant) => variant.isActive);
  return variants.length > 0 && variants.every((variant) => getStockStatus(variant) === "out");
}

export async function listProducts(
  searchTerm = "",
  filter: ProductStockFilter = "all",
  providerId?: string,
) {
  const query = searchTerm.trim() ? `?search=${encodeURIComponent(searchTerm.trim())}` : "";
  const rows = await apiRequest<ProductRow[]>(`/products${query}`);
  const products = await Promise.all(rows.map(hydrateProduct));

  return products
    .filter((product) => !providerId || product.providerId === providerId)
    .map(toProductListItem)
    .filter((product) => matchesStockFilter(product, filter));
}

export async function getProductDetails(id: string) {
  const row = await apiRequest<ProductRow>(`/products/${encodeURIComponent(id)}`);
  return toProductListItem(await hydrateProduct(row));
}

export async function createProductFromForm(values: ProductFormValues) {
  const categories = await listCategories();
  const generalCategory = categories.find((category) => category.name === "General") ?? categories[0];

  if (!generalCategory) {
    throw new Error("Crea una categoria antes de crear productos por API.");
  }

  const productId = createId("product");
  const row = await apiRequest<ProductRow>("/products", {
    method: "POST",
    body: JSON.stringify({
      id: productId,
      category_id: generalCategory.id,
      provider_id: values.providerId,
      name: normalizeName(values.name),
      description: null,
      is_active: true,
    }),
  });

  for (const variant of values.variants) {
    await apiRequest("/product-variants", {
      method: "POST",
      body: JSON.stringify({
        id: createId("variant"),
        product_id: productId,
        color: cleanText(variant.color),
        size: cleanText(variant.size),
        model: cleanText(variant.model),
        sku: null,
        barcode: null,
        cost_price: variant.costPrice,
        sale_price: variant.salePrice,
        is_active: true,
      }),
    });
  }

  return toProductListItem(await hydrateProduct(row));
}

export async function updateProductFromForm(id: string, values: ProductFormValues) {
  const row = await apiRequest<ProductRow>(`/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      provider_id: values.providerId,
      name: normalizeName(values.name),
    }),
  });

  return toProductListItem(await hydrateProduct(row));
}

export async function deleteProduct(id: string) {
  const row = await apiRequest<ProductRow>(`/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return mapProduct(row);
}
