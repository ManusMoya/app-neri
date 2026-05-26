import React from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Button, EmptyState, Header, LoadingSpinner, Screen } from "@/components/ui";
import { PurchaseListItem } from "../components/PurchaseListItem";
import { usePurchasesList } from "../hooks/usePurchasesList";

export function PurchasesListScreen() {
  const router = useRouter();
  const { purchases, error, isLoading, isRefreshing, refresh } = usePurchasesList();

  return (
    <Screen scroll={false}>
      <Header 
        title="Compras" 
        subtitle="Ingreso de inventario y costos"
        rightSlot={
          <Button title="Nueva compra" onPress={() => router.push("/purchases/create")} size="sm" />
        }
      />

      {error ? (
        <View className="mb-4">
          <Text className="text-sm font-medium text-danger">{error}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <LoadingSpinner className="flex-1" />
      ) : (
        <FlatList
          data={purchases}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PurchaseListItem purchase={item} />}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
          ListEmptyComponent={
            !isLoading ? (
              <EmptyState
                title="Sin compras"
                description="Registra tu primera compra para cargar stock."
                actionLabel="Registrar Compra"
                onActionPress={() => router.push("/purchases/create")}
              />
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </Screen>
  );
}
