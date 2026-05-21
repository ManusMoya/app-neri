import { and, eq, sql } from "drizzle-orm";

import { getDatabase, type Database } from "@/database";
import {
  clients,
  orders,
  payments,
  type Payment,
  type paymentMethods,
  type paymentTypes,
} from "@/database/schema";
import { createId } from "@/utils/ids";

export interface RegisterOrderPaymentInput {
  orderId: string;
  amount: number;
  type?: (typeof paymentTypes)[number];
  method?: (typeof paymentMethods)[number];
  reference?: string;
  notes?: string;
  paidAt?: Date;
}

function assertPaymentAmount(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Payment amount must be a positive integer.");
  }
}

function calculatePaymentStatus(totalAmount: number, paidAmount: number) {
  if (paidAmount <= 0) {
    return "unpaid" as const;
  }

  if (paidAmount >= totalAmount) {
    return "paid" as const;
  }

  return "partial" as const;
}

function updateClientDebt(clientId: string, db: Database) {
  const [result] = db
    .select({
      debt: sql<number>`coalesce(sum(${orders.balanceDue}), 0)`,
    })
    .from(orders)
    .where(and(eq(orders.clientId, clientId), sql`${orders.status} != 'cancelled'`))
    .all();

  db.update(clients)
    .set({ debt: result?.debt ?? 0 })
    .where(eq(clients.id, clientId))
    .run();
}

export async function registerOrderPayment(input: RegisterOrderPaymentInput): Promise<Payment> {
  assertPaymentAmount(input.amount);

  const db = await getDatabase();

  return db.transaction((tx) => {
    const order = tx.select().from(orders).where(eq(orders.id, input.orderId)).get();

    if (!order) {
      throw new Error(`Order ${input.orderId} was not found.`);
    }

    if (order.status === "cancelled") {
      throw new Error("Cannot register payments for a cancelled order.");
    }

    const type = input.type ?? "partial";
    const signedAmount = type === "refund" ? -input.amount : input.amount;
    const nextPaidAmount = Math.max(order.paidAmount + signedAmount, 0);

    if (type !== "refund" && nextPaidAmount > order.totalAmount) {
      throw new Error("Payment exceeds the order balance.");
    }

    const nextBalanceDue = Math.max(order.totalAmount - nextPaidAmount, 0);
    const paymentStatus = calculatePaymentStatus(order.totalAmount, nextPaidAmount);

    const payment = tx
      .insert(payments)
      .values({
        id: createId("payment"),
        orderId: input.orderId,
        type,
        method: input.method ?? "cash",
        status: "completed",
        amount: input.amount,
        reference: input.reference,
        notes: input.notes,
        paidAt: input.paidAt,
      })
      .returning()
      .get();

    tx.update(orders)
      .set({
        paidAmount: nextPaidAmount,
        depositAmount:
          type === "deposit" ? order.depositAmount + input.amount : order.depositAmount,
        balanceDue: nextBalanceDue,
        paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id))
      .run();

    updateClientDebt(order.clientId, tx as unknown as Database);

    return payment;
  });
}
