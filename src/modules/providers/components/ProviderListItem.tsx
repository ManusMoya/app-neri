import { Pressable, Text, View } from "react-native";

import { Card } from "@/components/ui";

import type { ProviderRecord } from "../types";

interface ProviderListItemProps {
  provider: ProviderRecord;
  onPress: (id: string) => void;
}

export function ProviderListItem({ provider, onPress }: ProviderListItemProps) {
  return (
    <Pressable onPress={() => onPress(provider.id)}>
      <Card className="gap-2">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-base font-bold text-foreground">{provider.name}</Text>
            <Text className="text-sm text-muted-foreground">
              {provider.phone || provider.email || "Sin contacto cargado"}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
