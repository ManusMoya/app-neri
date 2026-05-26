import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getSQLiteConnection } from "@/database";
import type { Client } from "@/database/schema";
import { requireCurrentUser } from "@/services/auth.service";

import type { OrderListRecord } from "../types";

export interface PendingPurchaseProduct {
  productName: string;
  variantLabel: string;
  quantity: number;
  ordersCount: number;
}

export interface PendingPurchaseProviderGroup {
  providerId: string;
  providerName: string;
  products: PendingPurchaseProduct[];
}

type OrderWithClientRow = {
  id: string;
  client_id: string;
  status: OrderListRecord["status"];
  payment_status: OrderListRecord["paymentStatus"];
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  deposit_amount: number;
  paid_amount: number;
  balance_due: number;
  notes: string | null;
  ordered_at: number;
  created_at: number;
  updated_at: number;
  client_name: string;
  client_phone: string | null;
  client_whatsapp_link: string | null;
  client_debt: number;
  client_created_at: number;
};

type PendingPurchaseRow = {
  provider_id: string;
  provider_name: string;
  product_name: string;
  variant_label: string | null;
  quantity: number;
  orders_count: number;
};

function mapOrderRow(row: OrderWithClientRow): OrderListRecord {
  const client: Client = {
    id: row.client_id,
    name: row.client_name,
    phone: row.client_phone,
    whatsappLink: row.client_whatsapp_link,
    debt: row.client_debt,
    createdAt: new Date(row.client_created_at),
  };

  return {
    id: row.id,
    clientId: row.client_id,
    status: row.status,
    paymentStatus: row.payment_status,
    subtotalAmount: row.subtotal_amount,
    discountAmount: row.discount_amount,
    totalAmount: row.total_amount,
    depositAmount: row.deposit_amount,
    paidAmount: row.paid_amount,
    balanceDue: row.balance_due,
    notes: row.notes,
    orderedAt: new Date(row.ordered_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    client,
  };
}

async function listOrdersWithClient() {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const rows = await sqlite.getAllAsync<OrderWithClientRow>(
    `select
      orders.*,
      clients.name as client_name,
      clients.phone as client_phone,
      clients.whatsapp_link as client_whatsapp_link,
      clients.debt as client_debt,
      clients.created_at as client_created_at
    from orders
    inner join clients on clients.id = orders.client_id
    where orders.user_id = ?
    order by orders.ordered_at desc`,
    user.id,
  );

  return rows.map(mapOrderRow);
}

async function listPendingPurchasesByProvider(): Promise<PendingPurchaseProviderGroup[]> {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const rows = await sqlite.getAllAsync<PendingPurchaseRow>(
    `select
      providers.id as provider_id,
      providers.name as provider_name,
      order_items.product_name as product_name,
      order_items.variant_label as variant_label,
      sum(order_items.quantity) as quantity,
      count(distinct orders.id) as orders_count
    from order_items
    inner join orders on orders.id = order_items.order_id
    inner join product_variants on product_variants.id = order_items.product_variant_id
    inner join products on products.id = product_variants.product_id
    inner join providers on providers.id = products.provider_id
    where orders.status = 'draft' and orders.user_id = ?
    group by providers.id, order_items.product_name, order_items.variant_label
    order by providers.name asc, order_items.product_name asc`,
    user.id,
  );
  const groups = new Map<string, PendingPurchaseProviderGroup>();

  for (const row of rows) {
    const group = groups.get(row.provider_id) ?? {
      providerId: row.provider_id,
      providerName: row.provider_name,
      products: [],
    };

    group.products.push({
      productName: row.product_name,
      variantLabel: row.variant_label || "Estandar",
      quantity: row.quantity,
      ordersCount: row.orders_count,
    });
    groups.set(row.provider_id, group);
  }

  return Array.from(groups.values());
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
