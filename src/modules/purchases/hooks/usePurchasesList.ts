import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getSQLiteConnection } from "@/database";
import type { Provider } from "@/database/schema";
import { requireCurrentUser } from "@/services/auth.service";

import type { PurchaseListRecord } from "../types";

type PurchaseWithProviderRow = {
  id: string;
  provider_id: string;
  status: PurchaseListRecord["status"];
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

function mapPurchaseRow(row: PurchaseWithProviderRow): PurchaseListRecord {
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
  };
}

async function listPurchasesWithProvider() {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const rows = await sqlite.getAllAsync<PurchaseWithProviderRow>(
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
    where purchases.user_id = ?
    order by purchases.purchased_at desc`,
    user.id,
  );

  return rows.map(mapPurchaseRow);
}

export function usePurchasesList() {
  const [purchases, setPurchases] = useState<PurchaseListRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPurchases = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const result = await listPurchasesWithProvider();
      setPurchases(result);
      setError(null);
    }
 catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "No se pudieron cargar las compras.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPurchases();
    }, [loadPurchases]),
  );

  return {
    purchases,
    error,
    isLoading,
    isRefreshing,
    refresh: () => loadPurchases(true),
  };
}
