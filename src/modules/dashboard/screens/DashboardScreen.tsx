import React from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";

import { Button, Header, LoadingSpinner, Screen, ScreenBody } from "@/components/ui";
import { logoutApiUser as logoutUser } from "@/services/auth.api.service";

import { MetricCard } from "../components/MetricCard";
import { useDashboard } from "../hooks/useDashboard";

export function DashboardScreen() {
  const router = useRouter();
  const { metrics, isLoading, isRefreshing, error, refresh } = useDashboard();

  if (isLoading && !isRefreshing) {
    return <LoadingSpinner />;
  }

  return (
    <Screen>
      <Header
        title="Dashboard"
        subtitle="Balance general, ingresos, egresos y deuda."
        rightSlot={
          <Button
            title="Salir"
            size="sm"
            variant="outline"
            onPress={async () => {
              await logoutUser();
              router.replace("/" as Href);
            }}
          />
        }
      />
      <ScreenBody>
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
        >
          {error ? (
            <View className="mb-4 rounded-lg border border-error-200 bg-error-50 p-4">
              <Text className="text-error-700">{error}</Text>
            </View>
          ) : null}

          {metrics ? (
            <View className="gap-4 p-1">
              <MetricCard
                title="Balance general"
                value={metrics.balance}
                subtitle="Ingresos cobrados menos compras registradas."
              />

              <View className="flex-row gap-3">
                <MetricCard title="Ingresos" value={metrics.totalIncome} />
                <MetricCard title="Egresos" value={-metrics.totalExpenses} />
              </View>

              <MetricCard title="Deuda clientes" value={metrics.totalClientDebt} />
            </View>
          ) : null}
        </ScrollView>
      </ScreenBody>
    </Screen>
  );
}
