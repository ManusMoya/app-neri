import React, { useMemo, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Button, EmptyState, Header, LoadingSpinner, Screen } from "@/components/ui";
import { OrderListItem } from "../components/OrderListItem";
import { ClientSelector } from "../components/ClientSelector";
import { useOrdersList } from "../hooks/useOrdersList";

type OrderPurchaseFilter = "all" | "pending";

const filters: { label: string; value: OrderPurchaseFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "Pendientes", value: "pending" },
];

export function OrdersListScreen() {
  const router = useRouter();
  const { orders, error, isLoading, isRefreshing, refresh } = useOrdersList();
  const [filter, setFilter] = useState<OrderPurchaseFilter>("all");
  const [clientSelectorVisible, setClientSelectorVisible] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<"all" | "unpaid" | "debt">("all");
  const filteredOrders = useMemo(
    () => orders.filter((order) => {
      if (filter === "pending") {
        if (order.status !== "draft") {
          return false;
        }
      }

      if (selectedClientId && order.clientId !== selectedClientId) {
        return false;
      }

      if (paymentFilter === "unpaid" && order.paymentStatus !== "unpaid") {
        return false;
      }

      if (paymentFilter === "debt" && order.balanceDue <= 0) {
        return false;
      }

      return true;
    }),
    [filter, orders, paymentFilter, selectedClientId],
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

      <View className="mb-4 gap-2">
        <View className="flex-row gap-2">
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
        <View className="flex-row flex-wrap gap-2">
          <Button
            title={selectedClientName ? selectedClientName : "Cliente"}
            size="sm"
            variant={selectedClientId ? "primary" : "outline"}
            className="min-w-[112px] flex-1"
            onPress={() => setClientSelectorVisible(true)}
          />
          <Button
            title="Impagos"
            size="sm"
            variant={paymentFilter === "unpaid" ? "primary" : "outline"}
            className="min-w-[96px] flex-1"
            onPress={() => setPaymentFilter((current) => current === "unpaid" ? "all" : "unpaid")}
          />
          <Button
            title="Deudores"
            size="sm"
            variant={paymentFilter === "debt" ? "primary" : "outline"}
            className="min-w-[96px] flex-1"
            onPress={() => setPaymentFilter((current) => current === "debt" ? "all" : "debt")}
          />
          {(selectedClientId || paymentFilter !== "all") ? (
            <Button
              title="Limpiar"
              size="sm"
              variant="ghost"
              className="min-w-[96px] flex-1"
              onPress={() => {
                setSelectedClientId(null);
                setSelectedClientName(null);
                setPaymentFilter("all");
              }}
            />
          ) : null}
        </View>
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
      <ClientSelector
        visible={clientSelectorVisible}
        onClose={() => setClientSelectorVisible(false)}
        onSelect={(client) => {
          setSelectedClientId(client.id);
          setSelectedClientName(client.name);
        }}
      />
    </Screen>
  );
}
