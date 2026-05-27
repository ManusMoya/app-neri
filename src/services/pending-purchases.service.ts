import type { ProductListRecord } from "@/modules/products/types";
import { buildVariantLabel } from "@/modules/products/utils";

import { listOrderItems } from "./order-items.api.service";
import { listOrders } from "./orders.api.service";
import { listProducts } from "./products.api.service";

export interface PendingPurchaseProduct {
  productVariantId: string;
  productName: string;
  variantLabel: string;
  quantity: number;
  requestedQuantity: number;
  availableStock: number;
  ordersCount: number;
  costPrice: number;
  stock: number;
}

export interface PendingPurchaseProviderGroup {
  providerId: string;
  providerName: string;
  products: PendingPurchaseProduct[];
}

type VariantLookup = {
  product: ProductListRecord;
  variant: ProductListRecord["variants"][number];
};

export async function listPendingPurchasesByProvider(): Promise<PendingPurchaseProviderGroup[]> {
  const [orders, orderItems, products] = await Promise.all([
    listOrders(),
    listOrderItems(),
    listProducts(),
  ]);

  const pendingOrderIds = new Set(
    orders
      .filter((order) => order.status === "draft")
      .map((order) => order.id),
  );
  const variantLookup = new Map<string, VariantLookup>();

  for (const product of products) {
    for (const variant of product.variants) {
      variantLookup.set(variant.id, { product, variant });
    }
  }

  const providers = new Map<string, PendingPurchaseProviderGroup>();
  const orderIdsByVariant = new Map<string, Set<string>>();

  for (const item of orderItems) {
    if (!pendingOrderIds.has(item.orderId)) {
      continue;
    }

    const lookup = variantLookup.get(item.productVariantId);

    if (!lookup) {
      continue;
    }

    const { product, variant } = lookup;
    const providerId = product.provider.id;
    let group = providers.get(providerId);

    if (!group) {
      group = {
        providerId,
        providerName: product.provider.name,
        products: [],
      };
      providers.set(providerId, group);
    }

    let pendingProduct = group.products.find(
      (productItem) => productItem.productVariantId === item.productVariantId,
    );

    if (!pendingProduct) {
      pendingProduct = {
        productVariantId: item.productVariantId,
        productName: product.name,
        variantLabel: item.variantLabel || buildVariantLabel(variant),
        quantity: 0,
        requestedQuantity: 0,
        availableStock: Math.max(variant.stock - variant.reservedStock, 0),
        ordersCount: 0,
        costPrice: variant.costPrice,
        stock: variant.stock,
      };
      group.products.push(pendingProduct);
      orderIdsByVariant.set(item.productVariantId, new Set());
    }

    pendingProduct.requestedQuantity += item.quantity;
    orderIdsByVariant.get(item.productVariantId)?.add(item.orderId);
    pendingProduct.ordersCount = orderIdsByVariant.get(item.productVariantId)?.size ?? 0;
    pendingProduct.quantity = Math.max(
      pendingProduct.requestedQuantity - pendingProduct.availableStock,
      0,
    );
  }

  return Array.from(providers.values())
    .map((group) => ({
      ...group,
      products: group.products
        .filter((product) => product.quantity > 0)
        .sort((a, b) =>
          a.productName.localeCompare(b.productName)
            || a.variantLabel.localeCompare(b.variantLabel),
        ),
    }))
    .filter((group) => group.products.length > 0)
    .sort((a, b) => a.providerName.localeCompare(b.providerName));
}
