import { useCallback } from "react";
import * as Clipboard from "expo-clipboard";
import { Alert, FlatList, Platform, RefreshControl, Text, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import {
  Button,
  Card,
  EmptyState,
  Header,
  Input,
  LoadingSpinner,
  Screen,
} from "@/components/ui";

import { ProductListItem } from "../components";
import { useProductsList } from "../hooks";
import type { ProductListRecord, ProductStockFilter } from "../types";
import type { PendingPurchaseProviderGroup } from "@/services/pending-purchases.service";

const filters: { label: string; value: ProductStockFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "Stock", value: "stock" },
  { label: "A comprar", value: "to-buy" },
];

function buildToBuyText(groups: PendingPurchaseProviderGroup[]) {
  const lines = ["Productos a comprar"];

  for (const group of groups) {
    lines.push("", `Proveedor: ${group.providerName}`);

    for (const product of group.products) {
      lines.push(`- ${product.productName} (${product.variantLabel}) x${product.quantity}`);
    }
  }

  return lines.join("\n");
}

function showCopyFeedback(message: string) {
  if (Platform.OS === "web") {
    globalThis.alert(message);
    return;
  }

  Alert.alert("Lista copiada", message);
}

export function ProductsListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ providerId?: string | string[] }>();
  const providerId = Array.isArray(params.providerId) ? params.providerId[0] : params.providerId;
  const {
    emptyTitle,
    error,
    filter,
    isLoading,
    isRefreshing,
    products,
    pendingPurchases,
    refresh,
    resetFilters,
    searchTerm,
    setFilter,
    setSearchTerm,
  } = useProductsList(providerId);
  const hasProviderFilter = Boolean(providerId);
  const hasActiveFilters = searchTerm.trim().length > 0 || filter !== "all" || hasProviderFilter;

  const openProduct = useCallback(
    (id: string) => {
      router.push(`/products/${id}` as Href);
    },
    [router],
  );

  const renderProduct = useCallback(
    ({ item }: { item: ProductListRecord }) => (
      <ProductListItem product={item} onPress={openProduct} />
    ),
    [openProduct],
  );

  const showAllProducts = useCallback(() => {
    resetFilters();
    router.replace("/products" as Href);
  }, [resetFilters, router]);

  const copyToBuyList = useCallback(async (groups: PendingPurchaseProviderGroup[]) => {
    if (groups.length === 0) {
      showCopyFeedback("No hay productos a comprar para copiar.");
      return;
    }

    await Clipboard.setStringAsync(buildToBuyText(groups));
    showCopyFeedback("Lista copiada para pegar en WhatsApp.");
  }, []);

  return (
    <Screen scroll={false}>
      <Header
        title="Productos"
        subtitle={
          hasProviderFilter
            ? "Productos filtrados por proveedor."
            : "Catalogo, variantes y control de stock."
        }
        rightSlot={
          <Button
            title="Nuevo"
            size="sm"
            onPress={() => router.push("/products/create" as Href)}
          />
        }
      />

      <View className="mb-4 gap-3">
        <Input
          autoCapitalize="none"
          autoCorrect={false}
          label="Buscar"
          onChangeText={setSearchTerm}
          placeholder="Nombre, SKU o barcode"
          value={searchTerm}
        />
        <View className="flex-row flex-wrap gap-2">
          {filters.map((item) => (
            <Button
              key={item.value}
              title={item.label}
              size="sm"
              variant={filter === item.value ? "primary" : "outline"}
              className="min-w-[96px] flex-1"
              onPress={() => setFilter(item.value)}
            />
          ))}
        </View>
        {hasActiveFilters ? (
          <Button
            title="Ver todos los productos"
            variant="ghost"
            size="sm"
            onPress={showAllProducts}
          />
        ) : null}
        {error ? <Text className="text-sm font-medium text-danger">{error}</Text> : null}
      </View>

      {isLoading ? (
        <LoadingSpinner className="flex-1" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          ListHeaderComponent={
            filter === "to-buy" ? (
              <View className="mb-4 gap-3">
                <Card className="gap-3">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="min-w-0 flex-1 text-base font-bold text-foreground">
                      Lista para proveedores
                    </Text>
                    <Button
                      title="Copiar todo"
                      size="sm"
                      variant="outline"
                      onPress={() => copyToBuyList(pendingPurchases)}
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
                            onPress={() => copyToBuyList([group])}
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
                                {product.variantLabel} - pedido x{product.requestedQuantity}, stock x{product.availableStock}
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
                      No hay productos faltantes para comprar.
                    </Text>
                  )}
                </Card>
              </View>
            ) : null
          }
          contentContainerClassName="gap-3 pb-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
          ListEmptyComponent={
            <EmptyState
              title={emptyTitle}
              description={
                searchTerm.trim()
                  ? "No hay productos que coincidan con la busqueda."
                  : "Crea tu primer producto con variantes para empezar a controlar stock."
              }
              actionLabel={searchTerm.trim() ? undefined : "Crear producto"}
              onActionPress={
                searchTerm.trim()
                  ? undefined
                  : () => router.push("/products/create" as Href)
              }
            />
          }
        />
      )}
    </Screen>
  );
}
