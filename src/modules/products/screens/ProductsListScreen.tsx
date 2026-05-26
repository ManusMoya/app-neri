import { useCallback } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import {
  Button,
  EmptyState,
  Header,
  Input,
  LoadingSpinner,
  Screen,
} from "@/components/ui";

import { ProductListItem } from "../components";
import { useProductsList } from "../hooks";
import type { ProductListRecord, ProductStockFilter } from "../types";

const filters: { label: string; value: ProductStockFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "Sin stock", value: "out" },
  { label: "Stock bajo", value: "low" },
];

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
