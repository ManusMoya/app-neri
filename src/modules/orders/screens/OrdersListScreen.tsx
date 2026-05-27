import React, { useCallback, useMemo, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { Alert, FlatList, Platform, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Button, Card, EmptyState, Header, LoadingSpinner, Screen } from "@/components/ui";
import { OrderListItem } from "../components/OrderListItem";
import { type PendingPurchaseProviderGroup, useOrdersList } from "../hooks/useOrdersList";

type OrderPurchaseFilter = "all" | "purchased" | "pending";

const filters: { label: string; value: OrderPurchaseFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "Comprados", value: "purchased" },
  { label: "Pendientes", value: "pending" },
];

function buildPendingPurchasesText(groups: PendingPurchaseProviderGroup[]) {
  const lines = ["Pedidos pendientes para comprar"];

  for (const group of groups) {
    lines.push("", `Proveedor: ${group.providerName}`);

    for (const product of group.products) {
      lines.push(
        `- ${product.productName} (${product.variantLabel}) x${product.quantity} - ${product.ordersCount} pedido(s)`,
      );
    }
  }

  return lines.join("\n");
}

function buildProviderPendingPurchasesText(group: PendingPurchaseProviderGroup) {
  return buildPendingPurchasesText([group]);
}

function showCopyFeedback(message: string) {
  if (Platform.OS === "web") {
    globalThis.alert(message);
    return;
  }

  Alert.alert("Lista copiada", message);
}

export function OrdersListScreen() {
  const router = useRouter();
  const { orders, pendingPurchases, error, isLoading, isRefreshing, refresh } = useOrdersList();
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

  const handleCopyPendingPurchases = useCallback(async () => {
    if (pendingPurchases.length === 0) {
      showCopyFeedback("No hay pedidos pendientes para copiar.");
      return;
    }

    await Clipboard.setStringAsync(buildPendingPurchasesText(pendingPurchases));
    showCopyFeedback("Pegala en WhatsApp cuando quieras enviarla.");
  }, [pendingPurchases]);

  const handleCopyProviderPendingPurchases = useCallback(
    async (group: PendingPurchaseProviderGroup) => {
      await Clipboard.setStringAsync(buildProviderPendingPurchasesText(group));
      showCopyFeedback(`Lista de ${group.providerName} copiada para WhatsApp.`);
    },
    [],
  );

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
              <View className="mb-4 gap-3">
                <Card className="gap-3">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="min-w-0 flex-1 text-base font-bold text-foreground">
                      Productos pendientes por proveedor
                    </Text>
                    <Button
                      title="Copiar todo"
                      size="sm"
                      variant="outline"
                      onPress={handleCopyPendingPurchases}
                    />
                  </View>
                  {pendingPurchases.length > 0 ? (
                    pendingPurchases.map((group) => (
                      <View key={group.providerId} className="gap-3 border-t border-border pt-3">
                        <View className="flex-row items-center justify-between gap-3">
                          <Text className="min-w-0 flex-1 text-sm font-bold text-foreground">
                            {group.providerName}
                          </Text>
                          <Button
                            title="Copiar"
                            size="sm"
                            variant="outline"
                            onPress={() => handleCopyProviderPendingPurchases(group)}
                          />
                        </View>
                        {group.products.map((product) => (
                          <View
                            key={product.productVariantId}
                            className="flex-row items-start justify-between gap-3 border-b border-border pb-2 last:border-b-0 last:pb-0"
                          >
                            <View className="min-w-0 flex-1">
                              <Text className="text-sm font-semibold text-foreground">
                                {product.productName}
                              </Text>
                              <Text className="text-xs text-muted-foreground">
                                {product.variantLabel} - {product.ordersCount} pedido(s)
                              </Text>
                            </View>
                            <Text className="text-sm font-bold text-foreground">
                              x{product.quantity}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ))
                  ) : (
                    <Text className="text-sm text-muted-foreground">
                      No hay productos pendientes para comprar.
                    </Text>
                  )}
                </Card>
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="min-w-0 flex-1 text-base font-bold text-foreground">
                    Historial de pedidos pendientes
                  </Text>
                </View>
              </View>
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
