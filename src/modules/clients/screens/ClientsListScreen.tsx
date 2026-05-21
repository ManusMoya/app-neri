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

import { ClientListItem } from "../components";
import { useClientsList } from "../hooks";
import type { ClientRecord } from "../types";

export function ClientsListScreen() {
  const router = useRouter();
  const {
    clients,
    emptyTitle,
    error,
    isLoading,
    isRefreshing,
    refresh,
    searchTerm,
    setSearchTerm,
  } = useClientsList();

  const openClient = useCallback(
    (id: string) => {
      router.push(`/clients/${id}` as Href);
    },
    [router],
  );

  const renderClient = useCallback(
    ({ item }: { item: ClientRecord }) => (
      <ClientListItem client={item} onPress={openClient} />
    ),
    [openClient],
  );

  return (
    <Screen scroll={false}>
      <Header
        title="Clientes"
        subtitle="Gestion de clientes y saldos pendientes."
        rightSlot={
          <Button
            title="Nuevo"
            size="sm"
            onPress={() => router.push("/clients/create" as Href)}
          />
        }
      />

      <View className="mb-4 gap-3">
        <Input
          autoCapitalize="none"
          autoCorrect={false}
          label="Buscar"
          onChangeText={setSearchTerm}
          placeholder="Nombre o telefono"
          value={searchTerm}
        />
        {error ? <Text className="text-sm font-medium text-danger">{error}</Text> : null}
      </View>

      {isLoading ? (
        <LoadingSpinner className="flex-1" />
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={renderClient}
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
                  ? "No hay clientes que coincidan con la busqueda."
                  : "Crea tu primer cliente para empezar a registrar pedidos y saldos."
              }
              actionLabel={searchTerm.trim() ? undefined : "Crear cliente"}
              onActionPress={
                searchTerm.trim()
                  ? undefined
                  : () => router.push("/clients/create" as Href)
              }
            />
          }
        />
      )}
    </Screen>
  );
}
