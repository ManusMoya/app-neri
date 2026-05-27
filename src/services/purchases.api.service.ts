import type { Purchase, PurchaseItem } from "@/database/schema";
import { createId } from "@/utils/ids";
import { apiRequest, fromTimestamp, toTimestamp } from "./api-client";
import { createPurchaseItem } from "./purchase-items.api.service";
import { getProductVariant, updateProductVariant } from "./product-variants.api.service";

export interface CreatePurchaseItemInput {
  productVariantId: string;
  quantity: number;
  baseCost: number;
}

export interface CreateReceivedPurchaseInput {
  providerId: string;
  items: CreatePurchaseItemInput[];
  shippingAmount?: number;
  paidAmount?: number;
  reference?: string;
  notes?: string;
  purchasedAt?: Date;
}

export interface PurchaseWithItems {
  purchase: Purchase;
  items: PurchaseItem[];
}

type PurchaseRow = {
  id: string;
  provider_id: string;
  status: Purchase["status"];
  subtotal_amount: number;
  shipping_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  reference: string | null;
  notes: string | null;
  purchased_at: number | string;
  created_at: number | string;
  updated_at: number | string;
};

function mapPurchase(row: PurchaseRow): Purchase {
  return {
    id: row.id,
    providerId: row.provider_id,
    status: row.status,
    subtotalAmount: row.subtotal_amount,
    shippingAmount: row.shipping_amount,
    totalAmount: row.total_amount,
    paidAmount: row.paid_amount,
    balanceDue: row.balance_due,
    reference: row.reference,
    notes: row.notes,
    purchasedAt: fromTimestamp(row.purchased_at),
    createdAt: fromTimestamp(row.created_at),
    updatedAt: fromTimestamp(row.updated_at),
  };
}

function distributeShipping(items: CreatePurchaseItemInput[], shippingAmount: number) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.baseCost, 0);

  if (shippingAmount === 0 || subtotal === 0) {
    return items.map(() => 0);
  }

  let allocated = 0;

  return items.map((item, index) => {
    if (index === items.length - 1) {
      return shippingAmount - allocated;
    }

    const share = Math.round(((item.quantity * item.baseCost) / subtotal) * shippingAmount);
    allocated += share;

    return share;
  });
}

export async function listPurchases() {
  const rows = await apiRequest<PurchaseRow[]>("/purchases");
  return rows.map(mapPurchase);
}

export async function createReceivedPurchase(input: CreateReceivedPurchaseInput): Promise<PurchaseWithItems> {
  const subtotalAmount = input.items.reduce((sum, item) => sum + item.quantity * item.baseCost, 0);
  const shippingAmount = input.shippingAmount ?? 0;
  const totalAmount = subtotalAmount + shippingAmount;
  const paidAmount = input.paidAmount ?? 0;
  const purchaseId = createId("purchase");
  const row = await apiRequest<PurchaseRow>("/purchases", {
    method: "POST",
    body: JSON.stringify({
      id: purchaseId,
      provider_id: input.providerId,
      status: "received",
      subtotal_amount: subtotalAmount,
      shipping_amount: shippingAmount,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      balance_due: Math.max(totalAmount - paidAmount, 0),
      reference: input.reference ?? null,
      notes: input.notes ?? null,
      purchased_at: toTimestamp(input.purchasedAt),
    }),
  });

  const shippingByLine = distributeShipping(input.items, shippingAmount);
  const items = await Promise.all(input.items.map(async (item, index) => {
    const variant = await getProductVariant(item.productVariantId);
    const shippingCost = shippingByLine[index] ?? 0;
    const lineTotal = item.quantity * item.baseCost + shippingCost;
    const realCost = Math.round(lineTotal / item.quantity);
    const nextStock = variant.stock + item.quantity;
    const nextCost = Math.round(
      (variant.stock * variant.costPrice + item.quantity * realCost) / nextStock,
    );

    const purchaseItem = await createPurchaseItem({
      purchase_id: purchaseId,
      product_variant_id: item.productVariantId,
      quantity: item.quantity,
      base_cost: item.baseCost,
      shipping_cost: shippingCost,
      real_cost: realCost,
      line_total: lineTotal,
    });

    await updateProductVariant(item.productVariantId, {
      stock: nextStock,
      cost_price: nextCost,
    });

    return purchaseItem;
  }));

  return { purchase: mapPurchase(row), items };
}

export async function removePurchase(id: string) {
  const row = await apiRequest<PurchaseRow>(`/purchases/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return mapPurchase(row);
}
