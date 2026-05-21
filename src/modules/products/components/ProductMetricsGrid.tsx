import { Text, View } from "react-native";

import { Card, CurrencyText } from "@/components/ui";

interface ProductMetricsGridProps {
  stockTotal: number;
  reservedStock: number;
  availableStock: number;
  inventoryValue: number;
  averageMargin: number;
}

export function ProductMetricsGrid({
  stockTotal,
  reservedStock,
  availableStock,
  inventoryValue,
  averageMargin,
}: ProductMetricsGridProps) {
  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <Card className="flex-1 gap-1">
          <Text className="text-xs font-semibold uppercase text-muted-foreground">Stock</Text>
          <Text className="text-xl font-bold text-foreground">{stockTotal}</Text>
        </Card>
        <Card className="flex-1 gap-1">
          <Text className="text-xs font-semibold uppercase text-muted-foreground">Disponible</Text>
          <Text className="text-xl font-bold text-foreground">{availableStock}</Text>
        </Card>
      </View>
      <View className="flex-row gap-3">
        <Card className="flex-1 gap-1">
          <Text className="text-xs font-semibold uppercase text-muted-foreground">Reservado</Text>
          <Text className="text-xl font-bold text-foreground">{reservedStock}</Text>
        </Card>
        <Card className="flex-1 gap-1">
          <Text className="text-xs font-semibold uppercase text-muted-foreground">Margen prom.</Text>
          <Text className="text-xl font-bold text-foreground">{averageMargin}%</Text>
        </Card>
      </View>
      <Card className="gap-1">
        <Text className="text-xs font-semibold uppercase text-muted-foreground">
          Valor inventario
        </Text>
        <CurrencyText amount={inventoryValue} className="text-xl" />
      </Card>
    </View>
  );
}
