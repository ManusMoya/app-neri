import { Text, View } from "react-native";

import { Badge, Card, CurrencyText } from "@/components/ui";
import type { ProductVariant } from "@/database/schema";

import {
  buildVariantLabel,
  getStockStatus,
  getStockStatusLabel,
  getStockStatusTone,
  getVariantMargin,
} from "../utils";

interface VariantCardProps {
  variant: ProductVariant;
}

export function VariantCard({ variant }: VariantCardProps) {
  const status = getStockStatus(variant);
  const margin = getVariantMargin(variant);

  return (
    <Card className="gap-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-base font-bold text-foreground" numberOfLines={1}>
            {buildVariantLabel(variant)}
          </Text>
        </View>
        <Badge label={getStockStatusLabel(status)} tone={getStockStatusTone(status)} />
      </View>

      <View className="flex-row justify-between gap-2">
        <View>
          <Text className="text-xs font-semibold uppercase text-muted-foreground">Stock</Text>
          <Text className="text-base font-bold text-foreground">{variant.stock}</Text>
        </View>
        <View>
          <Text className="text-xs font-semibold uppercase text-muted-foreground">Costo</Text>
          <CurrencyText amount={variant.costPrice} />
        </View>
        <View>
          <Text className="text-xs font-semibold uppercase text-muted-foreground">Precio</Text>
          <CurrencyText amount={variant.salePrice} />
        </View>
        <View>
          <Text className="text-xs font-semibold uppercase text-muted-foreground">Margen</Text>
          <Text className="text-base font-bold text-foreground">
            {margin.profitPercent}%
          </Text>
        </View>
      </View>
    </Card>
  );
}
