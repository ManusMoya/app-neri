import type { Purchase, PurchaseItem } from "@/database/schema";
import { createId } from "@/utils/ids";
import { apiRequest, fromTimestamp, toTimestamp } from "./api-client";

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

export async function listPurchases() {
  const rows = await apiRequest<PurchaseRow[]>("/purchases");
  return rows.map(mapPurchase);
}

export async function createReceivedPurchase(input: CreateReceivedPurchaseInput): Promise<PurchaseWithItems> {
  const subtotalAmount = input.items.reduce((sum, item) => sum + item.quantity * item.baseCost, 0);
  const shippingAmount = input.shippingAmount ?? 0;
  const totalAmount = subtotalAmount + shippingAmount;
  const paidAmount = input.paidAmount ?? 0;
  const row = await apiRequest<PurchaseRow>("/purchases", {
    method: "POST",
    body: JSON.stringify({
      id: createId("purchase"),
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

  return { purchase: mapPurchase(row), items: [] };
}

export async function removePurchase(id: string) {
  const row = await apiRequest<PurchaseRow>(`/purchases/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return mapPurchase(row);
}
