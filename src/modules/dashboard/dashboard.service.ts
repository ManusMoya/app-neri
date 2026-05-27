import { Platform } from "react-native";

import { getSQLiteConnection } from "@/database";
import { requireCurrentUser } from "@/services/auth.service";

import type { DashboardMetrics } from "./types";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  if (Platform.OS === "web") {
    return {
      balance: 0,
      totalIncome: 0,
      totalExpenses: 0,
      totalClientDebt: 0,
    };
  }

  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();

  const incomeStats = await sqlite.getFirstAsync<{ total_income: number }>(
    "select coalesce(sum(paid_amount), 0) as total_income from orders where user_id = ? and status != 'cancelled'",
    user.id,
  );

  const expenseStats = await sqlite.getFirstAsync<{ total_expenses: number }>(
    "select coalesce(sum(total_amount), 0) as total_expenses from purchases where user_id = ? and status != 'cancelled'",
    user.id,
  );

  const debtStats = await sqlite.getFirstAsync<{ total_debt: number }>(
    "select coalesce(sum(debt), 0) as total_debt from clients where user_id = ?",
    user.id,
  );

  const totalIncome = incomeStats?.total_income ?? 0;
  const totalExpenses = expenseStats?.total_expenses ?? 0;

  return {
    balance: totalIncome - totalExpenses,
    totalIncome,
    totalExpenses,
    totalClientDebt: debtStats?.total_debt ?? 0,
  };
}
