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
  const [variantSearchTerm, setVariantSearchTerm] = useState("");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

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
      handleClose();
      return;
    }

    setSelectedProduct(product);
  };

  const handleVariantSelect = (variant: ProductListRecord["variants"][number]) => {
    onSelect({ ...variant, productName: selectedProduct?.name });
    handleClose();
  };

  const resetVariantFilters = () => {
    setVariantSearchTerm("");
    setSelectedModel(null);
    setSelectedColor(null);
    setSelectedSize(null);
  };

  const goBackToProducts = () => {
    setSelectedProduct(null);
    resetVariantFilters();
  };

  const handleClose = () => {
    setSelectedProduct(null);
    resetVariantFilters();
    onClose();
  };

  const variantOptions = useMemo(() => {
    const variants = selectedProduct?.variants ?? [];
    const models = new Set<string>();
    const colors = new Set<string>();
    const sizes = new Set<string>();

    variants.forEach((variant) => {
      if (variant.model) {
        models.add(variant.model);
      }
      if (variant.color) {
        colors.add(variant.color);
      }
      if (variant.size) {
        sizes.add(variant.size);
      }
    });

    return {
      models: Array.from(models).sort(),
      colors: Array.from(colors).sort(),
      sizes: Array.from(sizes).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)),
    };
  }, [selectedProduct]);

  const filteredVariants = useMemo(() => {
    const normalizedSearchTerm = variantSearchTerm.trim().toLowerCase();

    return (selectedProduct?.variants ?? []).filter((variant) => {
      if (selectedModel && variant.model !== selectedModel) {
        return false;
      }
      if (selectedColor && variant.color !== selectedColor) {
        return false;
      }
      if (selectedSize && variant.size !== selectedSize) {
        return false;
      }
      if (!normalizedSearchTerm) {
        return true;
      }

      return [
        variant.color,
        variant.size,
        variant.model,
        variant.sku,
        variant.barcode,
      ].some((value) => value?.toLowerCase().includes(normalizedSearchTerm));
    });
  }, [selectedColor, selectedModel, selectedProduct, selectedSize, variantSearchTerm]);

  const hasVariantFilters = Boolean(
    variantSearchTerm || selectedModel || selectedColor || selectedSize,
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 bg-background">
        <View className="border-b border-border bg-surface p-4">
          <View className="mb-4 flex-row items-center justify-between gap-3">
            <Text className="text-xl font-bold text-foreground">
              {selectedProduct ? "Seleccionar variante" : "Seleccionar producto"}
            </Text>
            <Button
              title={selectedProduct ? "Volver" : "Cerrar"}
              variant="ghost"
              onPress={() => selectedProduct ? goBackToProducts() : handleClose()}
            />
          </View>
          {!selectedProduct ? (
            <Input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          ) : (
            <View className="gap-3">
              <Input
                placeholder="Buscar variante por modelo, color, talle..."
                value={variantSearchTerm}
                onChangeText={setVariantSearchTerm}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {variantOptions.models.map((model) => (
                    <Button
                      key={`model-${model}`}
                      title={`Modelo ${model}`}
                      size="sm"
                      variant={selectedModel === model ? "primary" : "outline"}
                      onPress={() => setSelectedModel((current) => current === model ? null : model)}
                    />
                  ))}
                  {variantOptions.colors.map((color) => (
                    <Button
                      key={`color-${color}`}
                      title={`Color ${color}`}
                      size="sm"
                      variant={selectedColor === color ? "primary" : "outline"}
                      onPress={() => setSelectedColor((current) => current === color ? null : color)}
                    />
                  ))}
                  {variantOptions.sizes.map((size) => (
                    <Button
                      key={`size-${size}`}
                      title={`Talle ${size}`}
                      size="sm"
                      variant={selectedSize === size ? "primary" : "outline"}
                      onPress={() => setSelectedSize((current) => current === size ? null : size)}
                    />
                  ))}
                  {hasVariantFilters ? (
                    <Button
                      title="Limpiar"
                      size="sm"
                      variant="ghost"
                      onPress={resetVariantFilters}
                    />
                  ) : null}
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {selectedProduct ? (
          <ScrollView className="flex-1 p-4">
            <Text className="mb-4 text-lg font-bold text-foreground">{selectedProduct.name}</Text>
            {filteredVariants.length > 0 ? (
              filteredVariants.map((variant) => (
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
              ))
            ) : (
              <View className="p-6">
                <Text className="text-center text-muted-foreground">
                  No hay variantes con esos filtros.
                </Text>
              </View>
            )}
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
