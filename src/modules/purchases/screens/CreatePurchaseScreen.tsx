import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useRouter, type Href } from "expo-router";

import { getSQLiteConnection } from "@/database";
import { requireCurrentUser } from "@/services/auth.service";
import { Button, Card, CurrencyText, Header, Input, Screen, ScreenBody } from "@/components/ui";
import { ProductSelector } from "@/modules/orders/components/ProductSelector";

import { ProviderSelector } from "../components/ProviderSelector";
import { usePurchaseForm } from "../hooks/usePurchaseForm";

type PendingPurchaseRow = {
  provider_id: string;
  product_variant_id: string;
  product_name: string;
  variant_label: string | null;
  quantity: number;
  cost_price: number;
  stock: number;
};

async function loadPendingPurchaseRows(providerId?: string | null) {
  if (!providerId) {
    return [];
  }

  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();

  return sqlite.getAllAsync<PendingPurchaseRow>(
    `select
      providers.id as provider_id,
      order_items.product_variant_id,
      order_items.product_name,
      order_items.variant_label,
      sum(order_items.quantity) as quantity,
      product_variants.cost_price,
      product_variants.stock
    from order_items
    inner join orders on orders.id = order_items.order_id
    inner join product_variants on product_variants.id = order_items.product_variant_id
    inner join products on products.id = product_variants.product_id
    inner join providers on providers.id = products.provider_id
    where orders.status = 'draft' and orders.user_id = ? and providers.id = ?
    group by providers.id, order_items.product_variant_id, order_items.product_name, order_items.variant_label
    order by order_items.product_name asc`,
    user.id,
    providerId,
  );
}

export function CreatePurchaseScreen() {
  const router = useRouter();
  const {
    setProvider,
    selectedProvider,
    items,
    addItem,
    addItemWithQuantity,
    updateQuantity,
    updateCost,
    shippingAmount,
    setShippingAmount,
    paidAmount,
    setPaidAmount,
    subtotal,
    total,
    isSubmitting,
    error,
    handleSubmit,
  } = usePurchaseForm();

  const [providerSelectorVisible, setProviderSelectorVisible] = useState(false);
  const [productSelectorVisible, setProductSelectorVisible] = useState(false);
  const [pendingRows, setPendingRows] = useState<PendingPurchaseRow[]>([]);
  const selectedItemIds = useMemo(
    () => new Set(items.map((item) => item.productVariantId)),
    [items],
  );

  const reloadPendingRows = useCallback(async () => {
    setPendingRows(await loadPendingPurchaseRows(selectedProvider?.id));
  }, [selectedProvider?.id]);

  useFocusEffect(
    useCallback(() => {
      void reloadPendingRows();
    }, [reloadPendingRows]),
  );

  return (
    <Screen>
      <Header
        title="Registrar compra"
        subtitle="La compra suma stock a los productos cargados."
        rightSlot={
          <Button
            title="Volver"
            size="sm"
            variant="outline"
            onPress={() => router.replace("/purchases" as Href)}
          />
        }
      />
      <ScreenBody>
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          {error ? (
            <View className="mb-4 rounded-md border border-danger bg-surface p-4">
              <Text className="text-danger">{error}</Text>
            </View>
          ) : null}

          <Card className="mb-4 gap-3 p-4">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-lg font-bold text-foreground">Proveedor</Text>
              <Button
                title={selectedProvider ? "Cambiar" : "Seleccionar"}
                variant="outline"
                size="sm"
                onPress={() => setProviderSelectorVisible(true)}
              />
            </View>
            {selectedProvider ? (
              <Text className="font-medium text-foreground">{selectedProvider.name}</Text>
            ) : (
              <Text className="text-muted-foreground">No se ha seleccionado un proveedor.</Text>
            )}
          </Card>

          {selectedProvider && pendingRows.length > 0 ? (
            <Card className="mb-4 gap-3 p-4">
              <Text className="text-lg font-bold text-foreground">
                Pedidos pendientes para comprar
              </Text>
              {pendingRows.map((row) => {
                const alreadyAdded = selectedItemIds.has(row.product_variant_id);

                return (
                  <View
                    key={row.product_variant_id}
                    className="flex-row items-center justify-between gap-3 border-b border-border py-3 last:border-b-0"
                  >
                    <View className="min-w-0 flex-1">
                      <Text className="font-medium text-foreground">
                        {row.product_name}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {row.variant_label || "Estandar"} · pendiente x{row.quantity}
                      </Text>
                    </View>
                    <Button
                      title={alreadyAdded ? "Agregado" : "Agregar"}
                      size="sm"
                      variant={alreadyAdded ? "secondary" : "outline"}
                      disabled={alreadyAdded}
                      onPress={() =>
                        addItemWithQuantity(
                          {
                            id: row.product_variant_id,
                            productName: row.product_name,
                            costPrice: row.cost_price,
                            stock: row.stock,
                          },
                          row.quantity,
                        )
                      }
                    />
                  </View>
                );
              })}
            </Card>
          ) : null}

          <Card className="mb-4 gap-3 p-4">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-lg font-bold text-foreground">Productos</Text>
              <Button
                title="Agregar"
                variant="outline"
                size="sm"
                onPress={() => setProductSelectorVisible(true)}
              />
            </View>
            {items.length > 0 ? (
              items.map((item) => (
                <View key={item.productVariantId} className="border-b border-border py-3">
                  <View className="mb-2 flex-row items-center justify-between gap-3">
                    <View className="flex-1">
                      <Text className="font-medium text-foreground">{item.variant.productName}</Text>
                      <Text className="text-xs text-muted-foreground">
                        Stock actual: {item.variant.stock}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Button title="-" variant="ghost" size="sm" onPress={() => updateQuantity(item.productVariantId, item.quantity - 1)} />
                      <Text className="w-8 text-center font-bold text-foreground">{item.quantity}</Text>
                      <Button title="+" variant="ghost" size="sm" onPress={() => updateQuantity(item.productVariantId, item.quantity + 1)} />
                    </View>
                  </View>
                  <View className="flex-row items-center gap-4">
                    <View className="flex-1">
                      <Input
                        keyboardType="numeric"
                        label="Costo unitario"
                        value={item.baseCost.toString()}
                        onChangeText={(value) => updateCost(item.productVariantId, Number(value) || 0)}
                      />
                    </View>
                    <View className="items-end">
                      <Text className="mb-1 text-xs text-muted-foreground">Total linea</Text>
                      <CurrencyText amount={item.baseCost * item.quantity} />
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-muted-foreground">No hay productos agregados.</Text>
            )}
          </Card>

          <Card className="mb-4 gap-3 p-4">
            <Text className="text-lg font-bold text-foreground">Resumen</Text>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Subtotal productos</Text>
              <CurrencyText amount={subtotal} />
            </View>
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-muted-foreground">Envio / Flete</Text>
              <View className="w-28">
                <Input
                  keyboardType="numeric"
                  value={shippingAmount.toString()}
                  onChangeText={(value) => setShippingAmount(Number(value) || 0)}
                  placeholder="0"
                />
              </View>
            </View>
            <View className="border-t border-border pt-3">
              <View className="flex-row justify-between">
                <Text className="text-lg font-bold text-foreground">Total compra</Text>
                <CurrencyText amount={total} className="text-lg font-bold text-primary" />
              </View>
            </View>
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-muted-foreground">Monto pagado</Text>
              <View className="w-28">
                <Input
                  keyboardType="numeric"
                  value={paidAmount.toString()}
                  onChangeText={(value) => setPaidAmount(Number(value) || 0)}
                  placeholder="0"
                />
              </View>
            </View>
          </Card>

          <Button
            title="Registrar ingreso"
            onPress={handleSubmit}
            loading={isSubmitting}
            size="lg"
            className="mb-10"
          />
        </ScrollView>
      </ScreenBody>

      <ProviderSelector
        visible={providerSelectorVisible}
        onClose={() => setProviderSelectorVisible(false)}
        onSelect={(provider) => setProvider(provider.id, provider)}
      />
      <ProductSelector
        visible={productSelectorVisible}
        onClose={() => setProductSelectorVisible(false)}
        onSelect={addItem}
      />
    </Screen>
  );
}
