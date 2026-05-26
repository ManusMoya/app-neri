import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getSQLiteConnection } from "@/database";
import type { Client, OrderItem, Payment } from "@/database/schema";
import { requireCurrentUser } from "@/services/auth.service";
import { changeOrderStatus, OrderWorkflowStatus } from "@/services/orders.service";
import { registerOrderPayment, RegisterOrderPaymentInput } from "@/services/payments.service";
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
  client_name: string;
  client_phone: string | null;
  client_whatsapp_link: string | null;
  client_debt: number;
  client_created_at: number;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_variant_id: string;
  product_name: string;
  variant_label: string | null;
  sku: string | null;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  discount_amount: number;
  line_subtotal: number;
  line_cost_total: number;
  profit_amount: number;
  created_at: number;
};

type PaymentRow = {
  id: string;
  order_id: string;
  type: Payment["type"];
  method: Payment["method"];
  status: Payment["status"];
  amount: number;
  reference: string | null;
  notes: string | null;
  paid_at: number;
  created_at: number;
};

function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productVariantId: row.product_variant_id,
    productName: row.product_name,
    variantLabel: row.variant_label,
    sku: row.sku,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    unitCost: row.unit_cost,
    discountAmount: row.discount_amount,
    lineSubtotal: row.line_subtotal,
    lineCostTotal: row.line_cost_total,
    profitAmount: row.profit_amount,
    createdAt: new Date(row.created_at),
  };
}

function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    orderId: row.order_id,
    type: row.type,
    method: row.method,
    status: row.status,
    amount: row.amount,
    reference: row.reference,
    notes: row.notes,
    paidAt: new Date(row.paid_at),
    createdAt: new Date(row.created_at),
  };
}

function mapOrder(row: OrderDetailRow, items: OrderItem[], payments: Payment[]): OrderWithDetails {
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
    items,
    payments,
  };
}

async function getOrderDetails(id: string) {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const order = await sqlite.getFirstAsync<OrderDetailRow>(
    `select
      orders.*,
      clients.name as client_name,
      clients.phone as client_phone,
      clients.whatsapp_link as client_whatsapp_link,
      clients.debt as client_debt,
      clients.created_at as client_created_at
    from orders
    inner join clients on clients.id = orders.client_id
    where orders.id = ? and orders.user_id = ?`,
    id,
    user.id,
  );

  if (!order) {
    return null;
  }

  const [items, payments] = await Promise.all([
    sqlite.getAllAsync<OrderItemRow>(
      "select * from order_items where order_id = ? order by created_at asc",
      id,
    ),
    sqlite.getAllAsync<PaymentRow>(
      "select * from payments where order_id = ? order by paid_at asc",
      id,
    ),
  ]);

  return mapOrder(order, items.map(mapOrderItem), payments.map(mapPayment));
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

      const input: RegisterOrderPaymentInput = {
        orderId: id,
        amount,
        method,
        type: amount >= order.balanceDue ? "final" : "partial",
        notes,
      };
      await registerOrderPayment(input);
      await loadOrder();
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
