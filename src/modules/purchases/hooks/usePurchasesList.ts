import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { listProviders } from "@/services/providers.api.service";
import { listPurchases } from "@/services/purchases.api.service";
import { compareDatesDesc } from "@/utils/sort";

import type { PurchaseListRecord } from "../types";

async function listPurchasesWithProvider() {
  const [purchases, providers] = await Promise.all([listPurchases(), listProviders()]);

  return purchases.map((purchase) => {
    const provider = providers.find((item) => item.id === purchase.providerId);

    if (!provider) {
      throw new Error("No se pudo cargar el proveedor de la compra.");
    }

    return {
      ...purchase,
      provider,
    } satisfies PurchaseListRecord;
  }).sort((a, b) => compareDatesDesc(a.purchasedAt, b.purchasedAt));
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
