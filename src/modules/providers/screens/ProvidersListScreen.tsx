import { useCallback } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";

import {
  Button,
  EmptyState,
  Header,
  Input,
  LoadingSpinner,
  Screen,
} from "@/components/ui";

import { ProviderListItem } from "../components";
import { useProvidersList } from "../hooks";
import type { ProviderRecord } from "../types";

export function ProvidersListScreen() {
  const router = useRouter();
  const {
    providers,
    emptyTitle,
    error,
    isLoading,
    isRefreshing,
    refresh,
    searchTerm,
    setSearchTerm,
  } = useProvidersList();

  const openProvider = useCallback(
    (id: string) => {
      router.push(`/providers/${id}` as Href);
    },
    [router],
  );

  const renderProvider = useCallback(
    ({ item }: { item: ProviderRecord }) => (
      <ProviderListItem provider={item} onPress={openProvider} />
    ),
    [openProvider],
  );

  return (
    <Screen scroll={false}>
      <Header
        title="Proveedores"
        subtitle="Gestion de proveedores para productos y compras."
        rightSlot={
          <Button
            title="Nuevo"
            size="sm"
            onPress={() => router.push("/providers/create" as Href)}
          />
        }
      />

      <View className="mb-4 gap-3">
        <Input
          autoCapitalize="none"
          autoCorrect={false}
          label="Buscar"
          onChangeText={setSearchTerm}
          placeholder="Nombre, telefono o email"
          value={searchTerm}
        />
        {error ? <Text className="text-sm font-medium text-danger">{error}</Text> : null}
      </View>

      {isLoading ? (
        <LoadingSpinner className="flex-1" />
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item) => item.id}
          renderItem={renderProvider}
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
                  ? "No hay proveedores que coincidan con la busqueda."
                  : "Crea tu primer proveedor para asignarlo a productos y compras."
              }
              actionLabel={searchTerm.trim() ? undefined : "Crear proveedor"}
              onActionPress={
                searchTerm.trim()
                  ? undefined
                  : () => router.push("/providers/create" as Href)
              }
            />
          }
        />
      )}
    </Screen>
  );
}
