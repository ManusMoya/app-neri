import React, { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, Text, View } from "react-native";

import { Button, Card, CurrencyText, Input } from "@/components/ui";
import { useProductsList } from "@/modules/products/hooks/useProductsList";
import type { ProductListRecord } from "@/modules/products/types";
import { useProvidersList } from "@/modules/providers/hooks/useProvidersList";
import { compareText, sortByText } from "@/utils/sort";

type VariantFilterKey = "model" | "color" | "size";

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
  const [selectedProviderId, setSelectedProviderId] = useState<string | undefined>(providerId);
  const { providers } = useProvidersList();
  const { products, searchTerm, setSearchTerm } = useProductsList(selectedProviderId);
  const [selectedProduct, setSelectedProduct] = useState<ProductListRecord | null>(null);
  const [variantSearchTerm, setVariantSearchTerm] = useState("");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [openVariantFilter, setOpenVariantFilter] = useState<VariantFilterKey | null>(null);

  const selectableProducts = useMemo(
    () => sortByText(products
      .map((product) => ({
        ...product,
        variants: sortByText(product.variants.filter((variant) => {
          if (!variant.isActive) {
            return false;
          }

          return stockOnly ? variant.stock - variant.reservedStock > 0 : true;
        }), (variant) => [variant.model, variant.color, variant.size].filter(Boolean).join(" ")),
      }))
      .filter((product) => product.variants.length > 0), (product) => product.name),
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
    setOpenVariantFilter(null);
  };

  const goBackToProducts = () => {
    setSelectedProduct(null);
    resetVariantFilters();
  };

  const handleClose = () => {
    setSelectedProduct(null);
    resetVariantFilters();
    setSelectedProviderId(providerId);
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
      models: Array.from(models).sort(compareText),
      colors: Array.from(colors).sort(compareText),
      sizes: Array.from(sizes).sort(compareText),
    };
  }, [selectedProduct]);

  const filteredVariants = useMemo(() => {
    const normalizedSearchTerm = variantSearchTerm.trim().toLowerCase();

    return sortByText((selectedProduct?.variants ?? []).filter((variant) => {
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
    }), (variant) => [variant.model, variant.color, variant.size].filter(Boolean).join(" "));
  }, [selectedColor, selectedModel, selectedProduct, selectedSize, variantSearchTerm]);

  const hasVariantFilters = Boolean(
    variantSearchTerm || selectedModel || selectedColor || selectedSize,
  );

  const renderVariantFilter = (
    key: VariantFilterKey,
    label: string,
    value: string | null,
    options: string[],
    onSelectOption: (value: string | null) => void,
  ) => {
    const isOpen = openVariantFilter === key;

    return (
      <View className="min-w-[104px] flex-1">
        <Pressable
          accessibilityRole="button"
          className="min-h-12 justify-center rounded-md border border-border bg-background px-3"
          onPress={() => setOpenVariantFilter((current) => current === key ? null : key)}
        >
          <Text className="text-xs font-semibold text-muted-foreground">{label}</Text>
          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
            {value || "Todos"}
          </Text>
        </Pressable>
        {isOpen ? (
          <View className="mt-2 overflow-hidden rounded-md border border-border bg-background">
            <Pressable
              className="border-b border-border px-3 py-3"
              onPress={() => {
                onSelectOption(null);
                setOpenVariantFilter(null);
              }}
            >
              <Text className="text-sm font-medium text-foreground">Todos</Text>
            </Pressable>
            {options.map((option) => (
              <Pressable
                key={`${key}-${option}`}
                className="border-b border-border px-3 py-3 last:border-b-0"
                onPress={() => {
                  onSelectOption(option);
                  setOpenVariantFilter(null);
                }}
              >
                <Text className="text-sm font-medium text-foreground">{option}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

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
            <View className="gap-3">
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              {!providerId ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    <Button
                      title="Todos"
                      size="sm"
                      variant={!selectedProviderId ? "primary" : "outline"}
                      onPress={() => setSelectedProviderId(undefined)}
                    />
                    {providers.map((provider) => (
                      <Button
                        key={provider.id}
                        title={provider.name}
                        size="sm"
                        variant={selectedProviderId === provider.id ? "primary" : "outline"}
                        onPress={() => setSelectedProviderId(provider.id)}
                      />
                    ))}
                  </View>
                </ScrollView>
              ) : null}
            </View>
          ) : (
            <View className="gap-3">
              <Input
                placeholder="Buscar variante por modelo, color, talle..."
                value={variantSearchTerm}
                onChangeText={setVariantSearchTerm}
              />
              <View className="flex-row flex-wrap items-start gap-2">
                {renderVariantFilter(
                  "model",
                  "Modelo",
                  selectedModel,
                  variantOptions.models,
                  setSelectedModel,
                )}
                {renderVariantFilter(
                  "color",
                  "Color",
                  selectedColor,
                  variantOptions.colors,
                  setSelectedColor,
                )}
                {renderVariantFilter(
                  "size",
                  "Talle",
                  selectedSize,
                  variantOptions.sizes,
                  setSelectedSize,
                )}
                {hasVariantFilters ? (
                  <Button
                    title="Limpiar"
                    size="sm"
                    variant="ghost"
                    className="min-w-[104px] flex-1"
                    onPress={resetVariantFilters}
                  />
                ) : null}
              </View>
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
