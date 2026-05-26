import { getSQLiteConnection } from "@/database";
import type { Purchase, PurchaseItem } from "@/database/schema";
import { createId } from "@/utils/ids";
import { requireCurrentUser } from "./auth.service";

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

type VariantCostRow = {
  stock: number;
  cost_price: number;
};

type PurchaseItemRow = {
  product_variant_id: string;
  quantity: number;
  real_cost: number;
};

function assertNonNegativeInteger(value: number, field: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} debe ser un entero no negativo.`);
  }
}

function assertPositiveInteger(value: number, field: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} debe ser un entero positivo.`);
  }
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

export async function createReceivedPurchase(
  input: CreateReceivedPurchaseInput,
): Promise<PurchaseWithItems> {
  if (input.items.length === 0) {
    throw new Error("La compra debe tener al menos un producto.");
  }

  const shippingAmount = input.shippingAmount ?? 0;
  const paidAmount = input.paidAmount ?? 0;

  assertNonNegativeInteger(shippingAmount, "Envio");
  assertNonNegativeInteger(paidAmount, "Monto pagado");

  for (const item of input.items) {
    assertPositiveInteger(item.quantity, "Cantidad");
    assertNonNegativeInteger(item.baseCost, "Costo");
  }

  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const provider = await sqlite.getFirstAsync<{ id: string }>(
    "select id from providers where id = ? and user_id = ?",
    input.providerId,
    user.id,
  );

  if (!provider) {
    throw new Error("Selecciona un proveedor de este usuario.");
  }

  const shippingByLine = distributeShipping(input.items, shippingAmount);
  const purchaseId = createId("purchase");
  const now = Date.now();
  const purchasedAt = input.purchasedAt?.getTime() ?? now;
  const itemRows = input.items.map((item, index) => {
    const lineBaseTotal = item.quantity * item.baseCost;
    const shippingCost = shippingByLine[index] ?? 0;
    const lineTotal = lineBaseTotal + shippingCost;
    const realCost = Math.round(lineTotal / item.quantity);

    return {
      id: createId("purchase_item"),
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      baseCost: item.baseCost,
      shippingCost,
      realCost,
      lineTotal,
    };
  });
  const subtotalAmount = itemRows.reduce((sum, item) => sum + item.quantity * item.baseCost, 0);
  const totalAmount = subtotalAmount + shippingAmount;

  if (paidAmount > totalAmount) {
    throw new Error("El monto pagado supera el total de la compra.");
  }

  await sqlite.withTransactionAsync(async () => {
    await sqlite.runAsync(
      `insert into purchases
        (id, user_id, provider_id, status, subtotal_amount, shipping_amount, total_amount,
          paid_amount, balance_due, reference, notes, purchased_at, created_at, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      purchaseId,
      user.id,
      input.providerId,
      "received",
      subtotalAmount,
      shippingAmount,
      totalAmount,
      paidAmount,
      totalAmount - paidAmount,
      input.reference ?? null,
      input.notes ?? null,
      purchasedAt,
      now,
      now,
    );

    for (const item of itemRows) {
      const variant = await sqlite.getFirstAsync<VariantCostRow>(
        `select product_variants.stock, product_variants.cost_price
        from product_variants
        inner join products on products.id = product_variants.product_id
        where product_variants.id = ? and product_variants.is_active = 1 and products.user_id = ?`,
        item.productVariantId,
        user.id,
      );

      if (!variant) {
        throw new Error("La variante seleccionada no existe.");
      }

      const nextStock = variant.stock + item.quantity;
      const nextCost = Math.round(
        (variant.stock * variant.cost_price + item.quantity * item.realCost) / nextStock,
      );

      await sqlite.runAsync(
        `insert into purchase_items
          (id, purchase_id, product_variant_id, quantity, base_cost, shipping_cost, real_cost, line_total, created_at)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        item.id,
        purchaseId,
        item.productVariantId,
        item.quantity,
        item.baseCost,
        item.shippingCost,
        item.realCost,
        item.lineTotal,
        now,
      );
      await sqlite.runAsync(
        "update product_variants set stock = stock + ?, cost_price = ?, updated_at = ? where id = ?",
        item.quantity,
        nextCost,
        now,
        item.productVariantId,
      );
    }
  });

  const purchase = await sqlite.getFirstAsync<Purchase>(
    "select * from purchases where id = ? and user_id = ?",
    purchaseId,
    user.id,
  );
  const items = await sqlite.getAllAsync<PurchaseItem>(
    "select * from purchase_items where purchase_id = ?",
    purchaseId,
  );

  if (!purchase) {
    throw new Error("No se pudo cargar la compra creada.");
  }

  return { purchase, items };
}

export async function removePurchase(id: string) {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const purchase = await sqlite.getFirstAsync<{ id: string }>(
    "select id from purchases where id = ? and user_id = ?",
    id,
    user.id,
  );

  if (!purchase) {
    throw new Error("Compra no encontrada.");
  }

  const items = await sqlite.getAllAsync<PurchaseItemRow>(
    "select product_variant_id, quantity, real_cost from purchase_items where purchase_id = ?",
    id,
  );
  const now = Date.now();

  await sqlite.withTransactionAsync(async () => {
    for (const item of items) {
      const variant = await sqlite.getFirstAsync<VariantCostRow>(
        "select stock, cost_price from product_variants where id = ?",
        item.product_variant_id,
      );

      if (!variant) {
        throw new Error("Una variante de la compra ya no existe.");
      }

      const nextStock = Math.max(0, variant.stock - item.quantity);
      const nextCost =
        nextStock > 0
          ? Math.max(
              0,
              Math.round(
                (
                  variant.stock * variant.cost_price -
                  Math.min(variant.stock, item.quantity) * item.real_cost
                ) / nextStock,
              ),
            )
          : 0;

      await sqlite.runAsync(
        "update product_variants set stock = ?, cost_price = ?, updated_at = ? where id = ?",
        nextStock,
        nextCost,
        now,
        item.product_variant_id,
      );
    }

    await sqlite.runAsync("delete from purchase_items where purchase_id = ?", id);
    const result = await sqlite.runAsync("delete from purchases where id = ?", id);

    if (result.changes === 0) {
      throw new Error("No se pudo eliminar la compra.");
    }
  });
}
