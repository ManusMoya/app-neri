import { Text, View } from "react-native";

import { Card, CurrencyText } from "@/components/ui";

interface ClientSummaryCardProps {
  debt: number;
  ordersCount: number;
}

export function ClientSummaryCard({ debt, ordersCount }: ClientSummaryCardProps) {
  return (
    <View className="flex-row gap-3">
      <Card className="flex-1 gap-1">
        <Text className="text-xs font-semibold uppercase text-muted-foreground">
          Deuda total
        </Text>
        <CurrencyText amount={debt} className={debt > 0 ? "text-xl text-danger" : "text-xl"} />
      </Card>
      <Card className="flex-1 gap-1">
        <Text className="text-xs font-semibold uppercase text-muted-foreground">
          Pedidos
        </Text>
        <Text className="text-xl font-bold text-foreground">{ordersCount}</Text>
      </Card>
    </View>
  );
}
