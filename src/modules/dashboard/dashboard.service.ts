import { listOrders } from "@/services/orders.api.service";
import { listPurchases } from "@/services/purchases.api.service";

import type { DashboardMetrics } from "./types";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [orders, purchases] = await Promise.all([
    listOrders(),
    listPurchases(),
  ]);

  const activeOrders = orders.filter((order) => order.status !== "cancelled");
  const activePurchases = purchases.filter((purchase) => purchase.status !== "cancelled");
  const totalIncome = activeOrders.reduce((sum, order) => sum + order.paidAmount, 0);
  const totalExpenses = activePurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
  const totalClientDebt = activeOrders.reduce((sum, order) => sum + order.balanceDue, 0);

  return {
    balance: totalIncome - totalExpenses,
    totalIncome,
    totalExpenses,
    totalClientDebt,
  };
}
