import type { Client, Order, OrderItem, Payment, ProductVariant } from "@/database/schema";
import type { OrderWorkflowStatus } from "@/services/orders.service";

export interface OrderWithDetails extends Order {
  client: Client;
  items: OrderItem[];
  payments: Payment[];
}

export type OrderListRecord = Order & {
  client: Client;
};

export type OrderStatusFilter = OrderWorkflowStatus | "all";
