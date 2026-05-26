import { Text, View } from "react-native";

import { Card } from "@/components/ui";

interface ProviderSummaryCardProps {
  productsCount: number;
  purchasesCount: number;
}

export function ProviderSummaryCard({ productsCount, purchasesCount }: ProviderSummaryCardProps) {
  return (
    <Card className="flex-row gap-3">
      <View className="flex-1 gap-1">
        <Text className="text-xs font-semibold uppercase text-muted-foreground">Productos</Text>
        <Text className="text-2xl font-bold text-foreground">{productsCount}</Text>
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-xs font-semibold uppercase text-muted-foreground">Compras</Text>
        <Text className="text-2xl font-bold text-foreground">{purchasesCount}</Text>
      </View>
    </Card>
  );
}
