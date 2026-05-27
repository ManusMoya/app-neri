import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { listClients } from "@/services/clients.api.service";
import { apiRequest } from "@/services/api-client";
import { changeOrderStatus, OrderWorkflowStatus } from "@/services/orders.api.service";
import { listOrderItems } from "@/services/order-items.api.service";
import { listPayments, registerOrderPayment } from "@/services/payments.api.service";
import type { OrderWithDetails } from "../types";

type OrderDetailRow = {
  id: string;
  client_id: string;
  status: OrderWithDetails["status"];
  payment_status: OrderWithDetails["paymentStatus"];
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
};

async function getOrderDetails(id: string) {
  const [row, clients, orderItems, payments] = await Promise.all([
    apiRequest<OrderDetailRow>(`/orders/${encodeURIComponent(id)}`),
    listClients(),
    listOrderItems(),
    listPayments(),
  ]);
  const client = clients.find((item) => item.id === row.client_id);
  const items = orderItems.filter((item) => item.orderId === id);
  const orderPayments = payments.filter((payment) => payment.orderId === id);

  if (!client) {
    throw new Error("No se pudo cargar el cliente del pedido.");
  }

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
    orderedAt: new Date(Number(row.ordered_at)),
    createdAt: new Date(Number(row.created_at)),
    updatedAt: new Date(Number(row.updated_at)),
    client,
    items,
    payments: orderPayments,
  } satisfies OrderWithDetails;
}

export function useOrderDetails(id: string) {
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadOrder = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getOrderDetails(id);

      if (!result) {
        setError("Pedido no encontrado.");
      } else {
        setOrder(result as unknown as OrderWithDetails);
        setError(null);
      }
    }
 catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el pedido.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadOrder();
    }, [loadOrder])
  );

  const handleChangeStatus = async (status: OrderWorkflowStatus) => {
    setIsActionLoading(true);
    try {
      await changeOrderStatus(id, status);
      setOrder((currentOrder) =>
        currentOrder
          ? {
              ...currentOrder,
              status,
              updatedAt: new Date(),
            }
          : currentOrder,
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cambiar el estado.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRegisterPayment = async (amount: number, method: any = "cash", notes?: string) => {
    setIsActionLoading(true);
    try {
      if (!order) {
        throw new Error("Pedido no encontrado.");
      }

      await registerOrderPayment({
        orderId: order.id,
        amount,
        method,
        type: amount >= order.balanceDue ? "final" : "partial",
        notes,
      });
      await loadOrder();
      setError(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al registrar el pago.");
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  return {
    order,
    isLoading,
    error,
    isActionLoading,
    refresh: loadOrder,
    handleChangeStatus,
    handleRegisterPayment,
  };
}
