import type { ProductVariant } from "@/database/schema";
import { createId } from "@/utils/ids";
import { apiRequest, fromTimestamp } from "./api-client";

export type ProductVariantApiInput = Partial<{
  product_id: string;
  color: string | null;
  size: string | null;
  model: string | null;
  sku: string | null;
  barcode: string | null;
  stock: number;
  reserved_stock: number;
  minimum_stock: number;
  cost_price: number;
  sale_price: number;
  is_active: boolean;
}>;

type ProductVariantRow = Required<Pick<ProductVariantApiInput, "product_id">> & {
  id: string;
  color: string | null;
  size: string | null;
  model: string | null;
  sku: string | null;
  barcode: string | null;
  stock: number;
  reserved_stock: number;
  minimum_stock: number;
  cost_price: number;
  sale_price: number;
  is_active: boolean;
  created_at: number | string;
  updated_at: number | string;
};

export function mapProductVariant(row: ProductVariantRow): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    color: row.color,
    size: row.size,
    model: row.model,
    sku: row.sku,
    barcode: row.barcode,
    stock: row.stock,
    reservedStock: row.reserved_stock,
    minimumStock: row.minimum_stock,
    costPrice: row.cost_price,
    salePrice: row.sale_price,
    isActive: Boolean(row.is_active),
    createdAt: fromTimestamp(row.created_at),
    updatedAt: fromTimestamp(row.updated_at),
  };
}

export async function listProductVariants(searchTerm = "") {
  const query = searchTerm.trim() ? `?search=${encodeURIComponent(searchTerm.trim())}` : "";
  const rows = await apiRequest<ProductVariantRow[]>(`/product-variants${query}`);
  return rows.map(mapProductVariant);
}

export async function getProductVariant(id: string) {
  const row = await apiRequest<ProductVariantRow>(`/product-variants/${encodeURIComponent(id)}`);
  return mapProductVariant(row);
}

export async function createProductVariant(input: ProductVariantApiInput) {
  const row = await apiRequest<ProductVariantRow>("/product-variants", {
    method: "POST",
    body: JSON.stringify({ id: createId("variant"), ...input }),
  });
  return mapProductVariant(row);
}

export async function updateProductVariant(id: string, input: ProductVariantApiInput) {
  const row = await apiRequest<ProductVariantRow>(`/product-variants/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return mapProductVariant(row);
}

export async function deleteProductVariant(id: string) {
  const row = await apiRequest<ProductVariantRow>(`/product-variants/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return mapProductVariant(row);
}
