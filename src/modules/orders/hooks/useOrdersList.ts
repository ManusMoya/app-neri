import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { listClients } from "@/services/clients.api.service";
import { listOrders } from "@/services/orders.api.service";
import {
  listPendingPurchasesByProvider,
  type PendingPurchaseProduct,
  type PendingPurchaseProviderGroup,
} from "@/services/pending-purchases.service";

import type { OrderListRecord } from "../types";

export type { PendingPurchaseProduct, PendingPurchaseProviderGroup };

async function listOrdersWithClient() {
  const [orders, clients] = await Promise.all([listOrders(), listClients()]);

  return orders.map((order) => {
    const client = clients.find((item) => item.id === order.clientId);

    if (!client) {
      throw new Error("No se pudo cargar el cliente del pedido.");
    }

    return {
      ...order,
      client,
    } satisfies OrderListRecord;
  });
}

export function useOrdersList() {
  const [orders, setOrders] = useState<OrderListRecord[]>([]);
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchaseProviderGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [ordersResult, pendingPurchasesResult] = await Promise.all([
        listOrdersWithClient(),
        listPendingPurchasesByProvider(),
      ]);
      setOrders(ordersResult);
      setPendingPurchases(pendingPurchasesResult);
      setError(null);
    }
 catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "No se pudieron cargar los pedidos.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
    }, [loadOrders]),
  );

  return {
    orders,
    pendingPurchases,
    error,
    isLoading,
    isRefreshing,
    refresh: () => loadOrders(true),
  };
}
