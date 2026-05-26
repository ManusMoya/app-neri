import React, { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, Text, View } from "react-native";

import { Button, Card, CurrencyText, Input } from "@/components/ui";
import { useProductsList } from "@/modules/products/hooks/useProductsList";
import type { ProductListRecord } from "@/modules/products/types";

interface ProductSelectorProps {
  onSelect: (variant: any) => void;
  onClose: () => void;
  visible: boolean;
  providerId?: string;
  stockOnly?: boolean;
}

function getVariantLabel(variant: ProductListRecord["variants"][number]) {
  return [variant.color, variant.size, variant.model].filter(Boolean).join(" / ") || "Estandar";
}

export function ProductSelector({
  onSelect,
  onClose,
  visible,
  providerId,
  stockOnly = false,
}: ProductSelectorProps) {
  const { products, searchTerm, setSearchTerm } = useProductsList(providerId);
  const [selectedProduct, setSelectedProduct] = useState<ProductListRecord | null>(null);

  const selectableProducts = useMemo(
    () => products
      .map((product) => ({
        ...product,
        variants: product.variants.filter((variant) => {
          if (!variant.isActive) {
            return false;
          }

          return stockOnly ? variant.stock - variant.reservedStock > 0 : true;
        }),
      }))
      .filter((product) => product.variants.length > 0),
    [products, stockOnly],
  );

  const handleProductSelect = (product: ProductListRecord) => {
    if (product.variants.length === 1) {
      onSelect({ ...product.variants[0], productName: product.name });
      onClose();
      return;
    }

    setSelectedProduct(product);
  };

  const handleVariantSelect = (variant: ProductListRecord["variants"][number]) => {
    onSelect({ ...variant, productName: selectedProduct?.name });
    setSelectedProduct(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        <View className="border-b border-border bg-surface p-4">
          <View className="mb-4 flex-row items-center justify-between gap-3">
            <Text className="text-xl font-bold text-foreground">
              {selectedProduct ? "Seleccionar variante" : "Seleccionar producto"}
            </Text>
            <Button
              title={selectedProduct ? "Volver" : "Cerrar"}
              variant="ghost"
              onPress={() => selectedProduct ? setSelectedProduct(null) : onClose()}
            />
          </View>
          {!selectedProduct ? (
            <Input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          ) : null}
        </View>

        {selectedProduct ? (
          <ScrollView className="flex-1 p-4">
            <Text className="mb-4 text-lg font-bold text-foreground">{selectedProduct.name}</Text>
            {selectedProduct.variants.map((variant) => (
              <Pressable key={variant.id} onPress={() => handleVariantSelect(variant)}>
                <Card className="mb-3 gap-2 p-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-foreground">
                        {getVariantLabel(variant)}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        Stock: {variant.stock - variant.reservedStock}
                      </Text>
                    </View>
                    <CurrencyText amount={variant.salePrice} className="text-lg font-bold text-primary" />
                  </View>
                </Card>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <FlatList
            data={selectableProducts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable onPress={() => handleProductSelect(item)}>
                <Card className="m-4 gap-2 p-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-foreground">{item.name}</Text>
                      <Text className="text-sm text-muted-foreground">{item.provider.name}</Text>
                    </View>
                    <View className="items-end">
                      <CurrencyText amount={item.variants[0]?.salePrice ?? 0} className="text-lg font-bold text-primary" />
                      <Text className="text-xs text-muted-foreground">Stock: {item.availableStock}</Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View className="p-6">
                <Text className="text-center text-muted-foreground">
                  {stockOnly ? "No hay productos con stock disponible." : "No hay productos cargados."}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}
