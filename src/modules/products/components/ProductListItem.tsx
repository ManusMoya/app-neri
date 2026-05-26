import { memo } from "react";
import { Pressable, Text, View } from "react-native";

import { Badge, Card } from "@/components/ui";

import type { ProductListRecord } from "../types";
import { getStockStatusLabel, getStockStatusTone } from "../utils";

interface ProductListItemProps {
  product: ProductListRecord;
  onPress: (id: string) => void;
}

function getProductStatus(product: ProductListRecord) {
  if (product.availableStock <= 0) {
    return "out";
  }

  return "normal";
}

function ProductListItemComponent({ product, onPress }: ProductListItemProps) {
  const status = getProductStatus(product);

  return (
    <Pressable onPress={() => onPress(product.id)} accessibilityRole="button">
      <Card className="gap-3">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1 gap-1">
            <Text className="text-base font-bold text-foreground" numberOfLines={1}>
              {product.name}
            </Text>
            <Text className="text-sm text-muted-foreground" numberOfLines={1}>
              {product.provider.name}
            </Text>
          </View>
          <Badge label={getStockStatusLabel(status)} tone={getStockStatusTone(status)} />
        </View>

        <View className="flex-row justify-between gap-2">
          <View>
            <Text className="text-xs font-semibold uppercase text-muted-foreground">Stock Total</Text>
            <Text className="text-base font-bold text-foreground">{product.stockTotal}</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export const ProductListItem = memo(ProductListItemComponent);
