import type { PurchaseItem } from "@/database/schema";
import { createId } from "@/utils/ids";
import { apiRequest, fromTimestamp } from "./api-client";

type PurchaseItemRow = {
  id: string;
  purchase_id: string;
  product_variant_id: string;
  quantity: number;
  base_cost: number;
  shipping_cost: number;
  real_cost: number;
  line_total: number;
  created_at: number | string;
};

function mapPurchaseItem(row: PurchaseItemRow): PurchaseItem {
  return {
    id: row.id,
    purchaseId: row.purchase_id,
    productVariantId: row.product_variant_id,
    quantity: row.quantity,
    baseCost: row.base_cost,
    shippingCost: row.shipping_cost,
    realCost: row.real_cost,
    lineTotal: row.line_total,
    createdAt: fromTimestamp(row.created_at),
  };
}

export async function listPurchaseItems() {
  const rows = await apiRequest<PurchaseItemRow[]>("/purchase-items");
  return rows.map(mapPurchaseItem);
}

export async function createPurchaseItem(input: Omit<PurchaseItemRow, "id" | "created_at">) {
  const row = await apiRequest<PurchaseItemRow>("/purchase-items", {
    method: "POST",
    body: JSON.stringify({ id: createId("purchase_item"), ...input }),
  });
  return mapPurchaseItem(row);
}

export async function deletePurchaseItem(id: string) {
  const row = await apiRequest<PurchaseItemRow>(`/purchase-items/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return mapPurchaseItem(row);
}
