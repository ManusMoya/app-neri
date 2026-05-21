import { desc, eq } from "drizzle-orm";

import { getDatabaseSync } from "../drizzle";
import { payments, type NewPayment, type Payment } from "../schema";
import type { RepositoryDatabase } from "./types";

export type RegisterPaymentInput = NewPayment;

export function registerPayment(
  input: RegisterPaymentInput,
  db: RepositoryDatabase = getDatabaseSync(),
) {
  return db.insert(payments).values(input).returning().get();
}

export function getPaymentsByOrder(
  orderId: string,
  db: RepositoryDatabase = getDatabaseSync(),
): Payment[] {
  return db
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .orderBy(desc(payments.paidAt))
    .all();
}

