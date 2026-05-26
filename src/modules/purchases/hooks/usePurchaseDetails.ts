import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getSQLiteConnection } from "@/database";
import type { Provider } from "@/database/schema";
import { requireCurrentUser } from "@/services/auth.service";

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
  provider_name: string;
  provider_phone: string | null;
  provider_whatsapp_link: string | null;
  provider_email: string | null;
  provider_address: string | null;
  provider_notes: string | null;
  provider_created_at: number;
  provider_updated_at: number;
};

type PurchaseItemRow = {
  id: string;
  purchase_id: string;
  product_variant_id: string;
  quantity: number;
  base_cost: number;
  shipping_cost: number;
  real_cost: number;
  line_total: number;
  created_at: number;
  product_name: string | null;
  variant_color: string | null;
  variant_size: string | null;
  variant_model: string | null;
  variant_sku: string | null;
};

function getVariantLabel(row: PurchaseItemRow) {
  return [row.variant_color, row.variant_size, row.variant_model]
    .filter(Boolean)
    .join(" / ") || "Estandar";
}

function mapItemRow(row: PurchaseItemRow): PurchaseItemWithProduct {
  return {
    id: row.id,
    purchaseId: row.purchase_id,
    productVariantId: row.product_variant_id,
    quantity: row.quantity,
    baseCost: row.base_cost,
    shippingCost: row.shipping_cost,
    realCost: row.real_cost,
    lineTotal: row.line_total,
    createdAt: new Date(row.created_at),
    productName: row.product_name ?? "Producto eliminado",
    variantLabel: getVariantLabel(row),
    sku: row.variant_sku,
  };
}

function mapPurchaseRow(row: PurchaseDetailRow, items: PurchaseItemWithProduct[]): PurchaseWithDetails {
  const provider: Provider = {
    id: row.provider_id,
    name: row.provider_name,
    phone: row.provider_phone,
    whatsappLink: row.provider_whatsapp_link,
    email: row.provider_email,
    address: row.provider_address,
    notes: row.provider_notes,
    createdAt: new Date(row.provider_created_at),
    updatedAt: new Date(row.provider_updated_at),
  };

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
    purchasedAt: new Date(row.purchased_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    provider,
    items,
  };
}

async function getPurchaseDetails(id: string) {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const purchase = await sqlite.getFirstAsync<PurchaseDetailRow>(
    `select
      purchases.*,
      providers.name as provider_name,
      providers.phone as provider_phone,
      providers.whatsapp_link as provider_whatsapp_link,
      providers.email as provider_email,
      providers.address as provider_address,
      providers.notes as provider_notes,
      providers.created_at as provider_created_at,
      providers.updated_at as provider_updated_at
    from purchases
    inner join providers on providers.id = purchases.provider_id
    where purchases.id = ? and purchases.user_id = ?`,
    id,
    user.id,
  );

  if (!purchase) {
    return null;
  }

  const itemRows = await sqlite.getAllAsync<PurchaseItemRow>(
    `select
      purchase_items.*,
      products.name as product_name,
      product_variants.color as variant_color,
      product_variants.size as variant_size,
      product_variants.model as variant_model,
      product_variants.sku as variant_sku
    from purchase_items
    left join product_variants on product_variants.id = purchase_items.product_variant_id
    left join products on products.id = product_variants.product_id
    where purchase_items.purchase_id = ?
    order by purchase_items.created_at asc`,
    id,
  );

  return mapPurchaseRow(purchase, itemRows.map(mapItemRow));
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
