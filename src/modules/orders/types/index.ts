import type { Client, Order, OrderItem, Payment } from "@/database/schema";
import type { OrderWorkflowStatus } from "@/services/orders.api.service";

export interface OrderWithDetails extends Order {
  client: Client;
  items: OrderItem[];
  payments: Payment[];
}

export type OrderListRecord = Order & {
  client: Client;
};

export type OrderStatusFilter = OrderWorkflowStatus | "all";
