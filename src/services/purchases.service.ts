import { eq, sql } from "drizzle-orm";

import { getDatabase } from "@/database";
import { productVariants, purchaseItems, purchases, type Purchase, type PurchaseItem } from "@/database/schema";
import { createId } from "@/utils/ids";

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

function assertNonNegativeInteger(value: number, field: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer.`);
  }
}

function assertPositiveInteger(value: number, field: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer.`);
  }
}

function distributeShipping(
  items: CreatePurchaseItemInput[],
  shippingAmount: number,
) {
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

export async function createReceivedPurchase(
  input: CreateReceivedPurchaseInput,
): Promise<PurchaseWithItems> {
  if (input.items.length === 0) {
    throw new Error("A purchase must contain at least one item.");
  }

  const shippingAmount = input.shippingAmount ?? 0;
  const paidAmount = input.paidAmount ?? 0;

  assertNonNegativeInteger(shippingAmount, "shippingAmount");
  assertNonNegativeInteger(paidAmount, "paidAmount");

  const db = await getDatabase();

  return db.transaction((tx) => {
    for (const item of input.items) {
      assertPositiveInteger(item.quantity, "quantity");
      assertNonNegativeInteger(item.baseCost, "baseCost");
    }

    const shippingByLine = distributeShipping(input.items, shippingAmount);
    const purchaseItemValues = input.items.map((item, index) => {
      const lineBaseTotal = item.quantity * item.baseCost;
      const lineShipping = shippingByLine[index] ?? 0;
      const lineTotal = lineBaseTotal + lineShipping;
      const realCost = Math.round(lineTotal / item.quantity);

      return {
        id: createId("purchase_item"),
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        baseCost: item.baseCost,
        shippingCost: lineShipping,
        realCost,
        lineTotal,
      };
    });

    const subtotalAmount = purchaseItemValues.reduce(
      (sum, item) => sum + item.quantity * item.baseCost,
      0,
    );
    const totalAmount = subtotalAmount + shippingAmount;

    if (paidAmount > totalAmount) {
      throw new Error("Paid amount exceeds purchase total.");
    }

    const purchase = tx
      .insert(purchases)
      .values({
        id: createId("purchase"),
        providerId: input.providerId,
        status: "received",
        subtotalAmount,
        shippingAmount,
        totalAmount,
        paidAmount,
        balanceDue: totalAmount - paidAmount,
        reference: input.reference,
        notes: input.notes,
        purchasedAt: input.purchasedAt,
      })
      .returning()
      .get();

    const createdItems = tx
      .insert(purchaseItems)
      .values(purchaseItemValues.map((item) => ({ ...item, purchaseId: purchase.id })))
      .returning()
      .all();

    for (const item of purchaseItemValues) {
      const variant = tx
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, item.productVariantId))
        .get();

      if (!variant) {
        throw new Error(`Product variant ${item.productVariantId} was not found.`);
      }

      const nextStock = variant.stock + item.quantity;
      const nextCost =
        nextStock === 0
          ? item.realCost
          : Math.round(
              (variant.stock * variant.costPrice + item.quantity * item.realCost) / nextStock,
            );

      tx.update(productVariants)
        .set({
          stock: sql`${productVariants.stock} + ${item.quantity}`,
          costPrice: nextCost,
          updatedAt: new Date(),
        })
        .where(eq(productVariants.id, item.productVariantId))
        .run();
    }

    return { purchase, items: createdItems };
  });
}

