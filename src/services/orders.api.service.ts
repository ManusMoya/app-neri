import type { Order, OrderItem } from "@/database/schema";
import { createId } from "@/utils/ids";
import { apiRequest, fromTimestamp, toTimestamp } from "./api-client";

export const ORDER_WORKFLOW_STATUS = {
  PENDING: "draft",
  RESERVED: "reserved",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export type OrderWorkflowStatus =
  (typeof ORDER_WORKFLOW_STATUS)[keyof typeof ORDER_WORKFLOW_STATUS];

export interface CreateOrderItemInput {
  productVariantId: string;
  quantity: number;
  unitPrice?: number;
  discountAmount?: number;
}

export interface CreateOrderInput {
  clientId: string;
  items: CreateOrderItemInput[];
  discountAmount?: number;
  depositAmount?: number;
  notes?: string;
  status?: OrderWorkflowStatus;
  orderedAt?: Date;
}

export interface OrderWithItems {
  order: Order;
  items: OrderItem[];
}

type OrderRow = {
  id: string;
  client_id: string;
  status: Order["status"];
  payment_status: Order["paymentStatus"];
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  deposit_amount: number;
  paid_amount: number;
  balance_due: number;
  notes: string | null;
  ordered_at: number | string;
  created_at: number | string;
  updated_at: number | string;
};

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    clientId: row.client_id,
    status: row.status,
    paymentStatus: row.payment_status,
    subtotalAmount: row.subtotal_amount,
    discountAmount: row.discount_amount,
    totalAmount: row.total_amount,
    depositAmount: row.deposit_amount,
    paidAmount: row.paid_amount,
    balanceDue: row.balance_due,
    notes: row.notes,
    orderedAt: fromTimestamp(row.ordered_at),
    createdAt: fromTimestamp(row.created_at),
    updatedAt: fromTimestamp(row.updated_at),
  };
}

export async function listOrders() {
  const rows = await apiRequest<OrderRow[]>("/orders");
  return rows.map(mapOrder);
}

export async function createOrder(input: CreateOrderInput): Promise<OrderWithItems> {
  const subtotalAmount = input.items.reduce(
    (sum, item) => sum + (item.unitPrice ?? 0) * item.quantity - (item.discountAmount ?? 0),
    0,
  );
  const discountAmount = input.discountAmount ?? 0;
  const totalAmount = Math.max(subtotalAmount - discountAmount, 0);
  const paidAmount = Math.min(input.depositAmount ?? 0, totalAmount);
  const orderId = createId("order");
  const row = await apiRequest<OrderRow>("/orders", {
    method: "POST",
    body: JSON.stringify({
      id: orderId,
      client_id: input.clientId,
      status: input.status ?? ORDER_WORKFLOW_STATUS.PENDING,
      payment_status: paidAmount === 0 ? "unpaid" : paidAmount === totalAmount ? "paid" : "partial",
      subtotal_amount: subtotalAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      deposit_amount: paidAmount,
      paid_amount: paidAmount,
      balance_due: totalAmount - paidAmount,
      notes: input.notes ?? null,
      ordered_at: toTimestamp(input.orderedAt),
    }),
  });

  return { order: mapOrder(row), items: [] };
}

export async function changeOrderStatus(orderId: string, nextStatus: OrderWorkflowStatus) {
  const row = await apiRequest<OrderRow>(`/orders/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: nextStatus }),
  });
  return mapOrder(row);
}

export async function removeOrder(orderId: string) {
  const row = await apiRequest<OrderRow>(`/orders/${encodeURIComponent(orderId)}`, {
    method: "DELETE",
  });
  return mapOrder(row);
}
