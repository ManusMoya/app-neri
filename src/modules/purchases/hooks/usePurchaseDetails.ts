import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { apiRequest } from "@/services/api-client";
import { listProductVariants } from "@/services/product-variants.api.service";
import { listProducts } from "@/services/products.api.service";
import { listPurchaseItems } from "@/services/purchase-items.api.service";
import { listProviders } from "@/services/providers.api.service";
import { buildVariantLabel } from "@/modules/products/utils";
import { compareText } from "@/utils/sort";

import type { PurchaseItemWithProduct, PurchaseWithDetails } from "../types";

type PurchaseDetailRow = {
  id: string;
  provider_id: string;
  status: PurchaseWithDetails["status"];
  subtotal_amount: number;
  shipping_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  reference: string | null;
  notes: string | null;
  purchased_at: number;
  created_at: number;
  updated_at: number;
};

async function getPurchaseDetails(id: string) {
  const [row, providers, purchaseItems, variants, products] = await Promise.all([
    apiRequest<PurchaseDetailRow>(`/purchases/${encodeURIComponent(id)}`),
    listProviders(),
    listPurchaseItems(),
    listProductVariants(),
    listProducts(),
  ]);
  const provider = providers.find((item) => item.id === row.provider_id);

  if (!provider) {
    throw new Error("No se pudo cargar el proveedor de la compra.");
  }

  const items = purchaseItems
    .filter((item) => item.purchaseId === row.id)
    .map((item) => {
      const variant = variants.find((current) => current.id === item.productVariantId);
      const product = variant
        ? products.find((current) => current.id === variant.productId)
        : null;

      return {
        ...item,
        productName: product?.name ?? "Producto no encontrado",
        variantLabel: variant ? buildVariantLabel(variant) : "Variante no encontrada",
        sku: variant?.sku ?? null,
      } satisfies PurchaseItemWithProduct;
    })
    .sort((a, b) => compareText(a.productName, b.productName)
      || compareText(a.variantLabel, b.variantLabel));

  return {
    id: row.id,
    providerId: row.provider_id,
    status: row.status,
    subtotalAmount: row.subtotal_amount,
    shippingAmount: row.shipping_amount,
    totalAmount: row.total_amount,
    paidAmount: row.paid_amount,
    balanceDue: row.balance_due,
    reference: row.reference,
    notes: row.notes,
    purchasedAt: new Date(Number(row.purchased_at)),
    createdAt: new Date(Number(row.created_at)),
    updatedAt: new Date(Number(row.updated_at)),
    provider,
    items,
  } satisfies PurchaseWithDetails;
}

export function usePurchaseDetails(id: string) {
  const [purchase, setPurchase] = useState<PurchaseWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPurchase = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPurchaseDetails(id);

      if (!result) {
        setError("Compra no encontrada.");
      } else {
        setPurchase(result as unknown as PurchaseWithDetails);
        setError(null);
      }
    }
 catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar la compra.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadPurchase();
    }, [loadPurchase])
  );

  return {
    purchase,
    isLoading,
    error,
    refresh: loadPurchase,
  };
}
