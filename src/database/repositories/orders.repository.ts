import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";

import { getDatabaseSync } from "../drizzle";
import {
  orderItems,
  orders,
  productVariants,
  type NewOrder,
  type Order,
  type OrderItem,
} from "../schema";
import type { RepositoryDatabase } from "./types";

export type CreateOrderInput = NewOrder;
export type OrderStatus = Order["status"];

export function createOrder(input: CreateOrderInput, db: RepositoryDatabase = getDatabaseSync()) {
  return db.insert(orders).values(input).returning().get();
}

export function getOrderById(id: string, db: RepositoryDatabase = getDatabaseSync()) {
  return db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      client: true,
      items: true,
      payments: true,
    },
  }).sync();
}

export function getOrders(db: RepositoryDatabase = getDatabaseSync()): Order[] {
  return db.select().from(orders).orderBy(desc(orders.orderedAt)).all();
}

export function updateOrderStatus(
  id: string,
  status: OrderStatus,
  db: RepositoryDatabase = getDatabaseSync(),
) {
  return db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning()
    .get();
}

export function getPendingOrders(db: RepositoryDatabase = getDatabaseSync()): Order[] {
  return db
    .select()
    .from(orders)
    .where(inArray(orders.status, ["draft", "confirmed"]))
    .orderBy(desc(orders.orderedAt))
    .all();
}

export function getOrdersWithoutStock(db: RepositoryDatabase = getDatabaseSync()): OrderItem[] {
  return db
    .select({ item: orderItems })
    .from(orderItems)
    .innerJoin(productVariants, eq(orderItems.productVariantId, productVariants.id))
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        inArray(orders.status, ["draft", "confirmed"]),
        lt(sql<number>`${productVariants.stock} - ${productVariants.reservedStock}`, orderItems.quantity),
      ),
    )
    .all()
    .map((row) => row.item);
}
