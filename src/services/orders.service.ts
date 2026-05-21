import { and, eq, sql } from "drizzle-orm";

import { getDatabase, type Database } from "@/database";
import {
  clients,
  orderItems,
  orders,
  payments,
  productVariants,
  products,
  type Order,
  type OrderItem,
} from "@/database/schema";
import { createId } from "@/utils/ids";

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

function assertPositiveAmount(value: number, field: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer amount.`);
  }
}

function assertPositiveQuantity(value: number) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("Item quantity must be a positive integer.");
  }
}

function buildVariantLabel(variant: {
  color: string | null;
  size: string | null;
  model: string | null;
}) {
  return [variant.color, variant.size, variant.model].filter(Boolean).join(" / ") || null;
}

function updateClientDebt(clientId: string, db: Database) {
  const debt = getClientDebtUpdater(db)(clientId);

  db.update(clients).set({ debt }).where(eq(clients.id, clientId)).run();

  return debt;
}

function getClientDebtUpdater(db: Database) {
  return (clientId: string) => {
    const [result] = db
      .select({
        debt: sql<number>`coalesce(sum(${orders.balanceDue}), 0)`,
      })
      .from(orders)
      .where(and(eq(orders.clientId, clientId), sql`${orders.status} != 'cancelled'`))
      .all();

    return result?.debt ?? 0;
  };
}

export async function createOrder(input: CreateOrderInput): Promise<OrderWithItems> {
  if (input.items.length === 0) {
    throw new Error("An order must contain at least one item.");
  }

  const discountAmount = input.discountAmount ?? 0;
  const depositAmount = input.depositAmount ?? 0;
  const status = input.status ?? ORDER_WORKFLOW_STATUS.PENDING;

  assertPositiveAmount(discountAmount, "discountAmount");
  assertPositiveAmount(depositAmount, "depositAmount");

  const db = await getDatabase();

  return db.transaction((tx) => {
    const itemRows = input.items.map((item) => {
      assertPositiveQuantity(item.quantity);

      const variant = tx
        .select({
          id: productVariants.id,
          stock: productVariants.stock,
          reservedStock: productVariants.reservedStock,
          costPrice: productVariants.costPrice,
          salePrice: productVariants.salePrice,
          sku: productVariants.sku,
          color: productVariants.color,
          size: productVariants.size,
          model: productVariants.model,
          productName: products.name,
        })
        .from(productVariants)
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(eq(productVariants.id, item.productVariantId))
        .get();

      if (!variant) {
        throw new Error(`Product variant ${item.productVariantId} was not found.`);
      }

      const availableStock = variant.stock - variant.reservedStock;

      if (
        (status === ORDER_WORKFLOW_STATUS.RESERVED ||
          status === ORDER_WORKFLOW_STATUS.DELIVERED) &&
        availableStock < item.quantity
      ) {
        throw new Error(`Insufficient stock for ${variant.productName}.`);
      }

      const unitPrice = item.unitPrice ?? variant.salePrice;
      const lineDiscount = item.discountAmount ?? 0;

      assertPositiveAmount(unitPrice, "unitPrice");
      assertPositiveAmount(lineDiscount, "discountAmount");

      const grossSubtotal = unitPrice * item.quantity;
      const lineSubtotal = Math.max(grossSubtotal - lineDiscount, 0);
      const lineCostTotal = variant.costPrice * item.quantity;

      return {
        id: createId("order_item"),
        productVariantId: item.productVariantId,
        productName: variant.productName,
        variantLabel: buildVariantLabel(variant),
        sku: variant.sku,
        quantity: item.quantity,
        unitPrice,
        unitCost: variant.costPrice,
        discountAmount: lineDiscount,
        lineSubtotal,
        lineCostTotal,
        profitAmount: lineSubtotal - lineCostTotal,
      };
    });

    const subtotalAmount = itemRows.reduce((sum, item) => sum + item.lineSubtotal, 0);
    const totalAmount = Math.max(subtotalAmount - discountAmount, 0);
    const paidAmount = Math.min(depositAmount, totalAmount);
    const balanceDue = totalAmount - paidAmount;

    const order = tx
      .insert(orders)
      .values({
        id: createId("order"),
        clientId: input.clientId,
        status,
        paymentStatus: paidAmount === 0 ? "unpaid" : balanceDue === 0 ? "paid" : "partial",
        subtotalAmount,
        discountAmount,
        totalAmount,
        depositAmount: paidAmount,
        paidAmount,
        balanceDue,
        notes: input.notes,
        orderedAt: input.orderedAt,
      })
      .returning()
      .get();

    const createdItems = tx
      .insert(orderItems)
      .values(itemRows.map((item) => ({ ...item, orderId: order.id })))
      .returning()
      .all();

    if (paidAmount > 0) {
      tx.insert(payments)
        .values({
          id: createId("payment"),
          orderId: order.id,
          type: "deposit",
          method: "cash",
          status: "completed",
          amount: paidAmount,
        })
        .run();
    }

    for (const item of itemRows) {
      if (status === ORDER_WORKFLOW_STATUS.RESERVED) {
        tx.update(productVariants)
          .set({
            reservedStock: sql`${productVariants.reservedStock} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(productVariants.id, item.productVariantId))
          .run();
      }

      if (status === ORDER_WORKFLOW_STATUS.DELIVERED) {
        tx.update(productVariants)
          .set({
            stock: sql`${productVariants.stock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(productVariants.id, item.productVariantId))
          .run();
      }
    }

    updateClientDebt(order.clientId, tx as unknown as Database);

    return { order, items: createdItems };
  });
}

export async function changeOrderStatus(orderId: string, nextStatus: OrderWorkflowStatus) {
  const db = await getDatabase();

  return db.transaction((tx) => {
    const order = tx.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { items: true },
    }).sync();

    if (!order) {
      throw new Error(`Order ${orderId} was not found.`);
    }

    if (order.status === nextStatus) {
      return order;
    }

    if (order.status === ORDER_WORKFLOW_STATUS.DELIVERED) {
      throw new Error("Delivered orders cannot be moved to another status.");
    }

    if (nextStatus === ORDER_WORKFLOW_STATUS.RESERVED) {
      for (const item of order.items) {
        const variant = tx
          .select()
          .from(productVariants)
          .where(eq(productVariants.id, item.productVariantId))
          .get();

        if (!variant || variant.stock - variant.reservedStock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.productName}.`);
        }
      }
    }

    for (const item of order.items) {
      if (order.status === ORDER_WORKFLOW_STATUS.RESERVED) {
        tx.update(productVariants)
          .set({
            reservedStock: sql`case when ${productVariants.reservedStock} - ${item.quantity} < 0 then 0 else ${productVariants.reservedStock} - ${item.quantity} end`,
            updatedAt: new Date(),
          })
          .where(eq(productVariants.id, item.productVariantId))
          .run();
      }

      if (nextStatus === ORDER_WORKFLOW_STATUS.RESERVED) {
        tx.update(productVariants)
          .set({
            reservedStock: sql`${productVariants.reservedStock} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(productVariants.id, item.productVariantId))
          .run();
      }

      if (nextStatus === ORDER_WORKFLOW_STATUS.DELIVERED) {
        tx.update(productVariants)
          .set({
            stock: sql`${productVariants.stock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(productVariants.id, item.productVariantId))
          .run();
      }
    }

    const updated = tx
      .update(orders)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(orders.id, order.id))
      .returning()
      .get();

    updateClientDebt(order.clientId, tx as unknown as Database);

    return updated;
  });
}
