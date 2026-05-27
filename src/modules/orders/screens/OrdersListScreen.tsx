import React, { useMemo, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Button, EmptyState, Header, LoadingSpinner, Screen } from "@/components/ui";
import { OrderListItem } from "../components/OrderListItem";
import { useOrdersList } from "../hooks/useOrdersList";

type OrderPurchaseFilter = "all" | "purchased" | "pending";

const filters: { label: string; value: OrderPurchaseFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "Comprados", value: "purchased" },
  { label: "Pendientes", value: "pending" },
];

export function OrdersListScreen() {
  const router = useRouter();
  const { orders, error, isLoading, isRefreshing, refresh } = useOrdersList();
  const [filter, setFilter] = useState<OrderPurchaseFilter>("all");
  const filteredOrders = useMemo(
    () => orders.filter((order) => {
      if (filter === "pending") {
        return order.status === "draft";
      }

      if (filter === "purchased") {
        return order.status !== "draft" && order.status !== "cancelled";
      }

      return true;
    }),
    [filter, orders],
  );

  const handleCreateOrder = () => {
    router.push("/orders/create");
  };

  return (
    <Screen scroll={false}>
      <Header 
        title="Pedidos" 
        subtitle="Gestiona tus ventas y reservas"
        rightSlot={
          <Button title="Nuevo pedido" onPress={handleCreateOrder} size="sm" />
        }
      />

      {error ? (
        <View className="mb-4">
          <Text className="text-sm font-medium text-danger">{error}</Text>
        </View>
      ) : null}

      <View className="mb-4 flex-row gap-2">
        {filters.map((item) => (
          <Button
            key={item.value}
            title={item.label}
            size="sm"
            variant={filter === item.value ? "primary" : "outline"}
            className="flex-1"
            onPress={() => setFilter(item.value)}
          />
        ))}
      </View>

      {isLoading ? (
        <LoadingSpinner className="flex-1" />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OrderListItem order={item} />}
          ListHeaderComponent={
            filter === "pending" ? (
              <Text className="mb-4 text-base font-bold text-foreground">
                Historial de pedidos pendientes
              </Text>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
          ListEmptyComponent={
            !isLoading ? (
              <EmptyState
                title={filter === "pending" ? "Sin pedidos pendientes" : "Sin pedidos"}
                description={
                  filter === "pending"
                    ? "No hay pedidos pendientes de compra."
                    : "Comienza creando tu primer pedido."
                }
                actionLabel="Crear Pedido"
                onActionPress={handleCreateOrder}
              />
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </Screen>
  );
}
