import type { OrderItem } from "@/database/schema";
import { createId } from "@/utils/ids";
import { apiRequest, fromTimestamp } from "./api-client";

type OrderItemRow = {
  id: string;
  order_id: string;
  product_variant_id: string;
  product_name: string;
  variant_label: string | null;
  sku: string | null;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  discount_amount: number;
  line_subtotal: number;
  line_cost_total: number;
  profit_amount: number;
  created_at: number | string;
};

function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productVariantId: row.product_variant_id,
    productName: row.product_name,
    variantLabel: row.variant_label,
    sku: row.sku,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    unitCost: row.unit_cost,
    discountAmount: row.discount_amount,
    lineSubtotal: row.line_subtotal,
    lineCostTotal: row.line_cost_total,
    profitAmount: row.profit_amount,
    createdAt: fromTimestamp(row.created_at),
  };
}

export async function listOrderItems() {
  const rows = await apiRequest<OrderItemRow[]>("/order-items");
  return rows.map(mapOrderItem);
}

export async function getOrderItem(id: string) {
  const row = await apiRequest<OrderItemRow>(`/order-items/${encodeURIComponent(id)}`);
  return mapOrderItem(row);
}

export async function createOrderItem(input: Omit<OrderItemRow, "id" | "created_at">) {
  const row = await apiRequest<OrderItemRow>("/order-items", {
    method: "POST",
    body: JSON.stringify({ id: createId("order_item"), ...input }),
  });
  return mapOrderItem(row);
}

export async function updateOrderItem(id: string, input: Partial<Omit<OrderItemRow, "id" | "created_at">>) {
  const row = await apiRequest<OrderItemRow>(`/order-items/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return mapOrderItem(row);
}

export async function deleteOrderItem(id: string) {
  const row = await apiRequest<OrderItemRow>(`/order-items/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return mapOrderItem(row);
}
