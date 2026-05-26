import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";

import { Button, Card, Input } from "@/components/ui";
import { getSQLiteConnection } from "@/database";
import type { Provider } from "@/database/schema";
import { requireCurrentUser } from "@/services/auth.service";

interface ProviderSelectorProps {
  onSelect: (provider: Provider) => void;
  onClose: () => void;
  visible: boolean;
}

export function ProviderSelector({ onSelect, onClose, visible }: ProviderSelectorProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);

  const loadProviders = useCallback(async () => {
    const sqlite = await getSQLiteConnection();
    const user = requireCurrentUser();
    const rows = await sqlite.getAllAsync<{
      id: string;
      name: string;
      phone: string | null;
      whatsapp_link: string | null;
      email: string | null;
      address: string | null;
      notes: string | null;
      created_at: number;
      updated_at: number;
    }>("select * from providers where user_id = ? and id not like 'provider_deleted%' order by name", user.id);

    setProviders(rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      whatsappLink: row.whatsapp_link,
      email: row.email,
      address: row.address,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    })));
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (visible) {
        void loadProviders();
      }
    }, [loadProviders, visible]),
  );

  const filtered = useMemo(
    () => providers.filter((provider) =>
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
    [providers, searchTerm],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        <View className="border-b border-border bg-surface p-4">
          <View className="mb-4 flex-row items-center justify-between gap-3">
            <Text className="text-xl font-bold text-foreground">Seleccionar proveedor</Text>
            <View className="flex-row gap-2">
              <Button
                title="Nuevo"
                size="sm"
                onPress={() => {
                  onClose();
                  router.push("/providers/create" as Href);
                }}
              />
              <Button title="Cerrar" size="sm" variant="ghost" onPress={onClose} />
            </View>
          </View>
          <Input
            placeholder="Buscar proveedor..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => { onSelect(item); onClose(); }}>
              <Card className="m-4 p-4">
                <Text className="text-lg font-bold text-foreground">{item.name}</Text>
              </Card>
            </Pressable>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </Modal>
  );
}
