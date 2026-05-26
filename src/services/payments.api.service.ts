import type { Payment } from "@/database/schema";
import type { RegisterOrderPaymentInput } from "./payments.service";
import { createId } from "@/utils/ids";
import { apiRequest, fromTimestamp, toTimestamp } from "./api-client";

type PaymentRow = {
  id: string;
  order_id: string;
  type: Payment["type"];
  method: Payment["method"];
  status: Payment["status"];
  amount: number;
  reference: string | null;
  notes: string | null;
  paid_at: number | string;
  created_at: number | string;
};

function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    orderId: row.order_id,
    type: row.type,
    method: row.method,
    status: row.status,
    amount: row.amount,
    reference: row.reference,
    notes: row.notes,
    paidAt: fromTimestamp(row.paid_at),
    createdAt: fromTimestamp(row.created_at),
  };
}

export async function listPayments() {
  const rows = await apiRequest<PaymentRow[]>("/payments");
  return rows.map(mapPayment);
}

export async function registerOrderPayment(input: RegisterOrderPaymentInput): Promise<Payment> {
  const row = await apiRequest<PaymentRow>("/payments", {
    method: "POST",
    body: JSON.stringify({
      id: createId("payment"),
      order_id: input.orderId,
      type: input.type ?? "partial",
      method: input.method ?? "cash",
      status: "completed",
      amount: input.amount,
      reference: input.reference ?? null,
      notes: input.notes ?? null,
      paid_at: toTimestamp(input.paidAt),
    }),
  });

  return mapPayment(row);
}

export async function deletePayment(id: string) {
  const row = await apiRequest<PaymentRow>(`/payments/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return mapPayment(row);
}
