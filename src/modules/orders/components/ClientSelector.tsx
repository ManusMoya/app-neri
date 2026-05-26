import React, { useEffect } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";

import { Button, Card, EmptyState, Input, LoadingSpinner } from "@/components/ui";
import { useClientsList } from "@/modules/clients/hooks/useClientsList";
import type { Client } from "@/database/schema";

interface ClientSelectorProps {
  onSelect: (client: Client) => void;
  onClose: () => void;
  visible: boolean;
}

export function ClientSelector({ onSelect, onClose, visible }: ClientSelectorProps) {
  const {
    clients,
    emptyTitle,
    error,
    isLoading,
    reload,
    searchTerm,
    setSearchTerm,
  } = useClientsList();

  useEffect(() => {
    if (visible) {
      reload();
    }
  }, [reload, visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        <View className="border-b border-border bg-surface p-4">
          <View className="mb-4 flex-row items-center justify-between gap-3">
            <Text className="text-xl font-bold text-foreground">Seleccionar cliente</Text>
            <Button title="Cerrar" variant="ghost" onPress={onClose} />
          </View>
          <Input
            placeholder="Buscar por nombre o telefono..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {error ? <Text className="mt-3 text-sm font-medium text-danger">{error}</Text> : null}
        </View>

        {isLoading ? (
          <LoadingSpinner className="flex-1" />
        ) : (
          <FlatList
            data={clients}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable onPress={() => { onSelect(item); onClose(); }}>
                <Card className="m-4 p-4">
                  <Text className="text-lg font-bold text-foreground">{item.name}</Text>
                  {item.phone ? (
                    <Text className="text-sm text-muted-foreground">{item.phone}</Text>
                  ) : null}
                </Card>
              </Pressable>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View className="p-4">
                <EmptyState
                  title={emptyTitle}
                  description={
                    searchTerm.trim()
                      ? "No hay clientes que coincidan con la busqueda."
                      : "Crea un cliente antes de generar un pedido."
                  }
                />
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}
