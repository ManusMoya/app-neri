import { memo } from "react";
import { Pressable, Text, View } from "react-native";

import { Card, CurrencyText } from "@/components/ui";

import type { ClientRecord } from "../types";

interface ClientListItemProps {
  client: ClientRecord;
  onPress: (id: string) => void;
}

function ClientListItemComponent({ client, onPress }: ClientListItemProps) {
  return (
    <Pressable onPress={() => onPress(client.id)} accessibilityRole="button">
      <Card className="gap-3 p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1 gap-1">
            <Text className="text-base font-bold text-foreground" numberOfLines={1}>
              {client.name}
            </Text>
            <Text className="text-sm text-muted-foreground" numberOfLines={1}>
              {client.phone || "Sin telefono"}
            </Text>
          </View>
          <View className="items-end gap-1">
            <Text className="text-xs font-semibold uppercase text-muted-foreground">
              Deuda
            </Text>
            <CurrencyText
              amount={client.debt}
              className={client.debt > 0 ? "text-danger" : "text-success"}
            />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export const ClientListItem = memo(ClientListItemComponent);
