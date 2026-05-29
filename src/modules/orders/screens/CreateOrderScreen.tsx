import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { Button, Card, CurrencyText, Header, Input, Screen, ScreenBody } from "@/components/ui";

import { ClientSelector, ProductSelector } from "../components";
import { useOrderForm } from "../hooks/useOrderForm";

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function CreateOrderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId?: string | string[] }>();
  const initialClientId = getIdParam(params.clientId);
  const {
    setClientId,
    selectedClient,
    items,
    addItem,
    updateQuantity,
    discountAmount,
    setDiscountAmount,
    depositAmount,
    setDepositAmount,
    installmentCount,
    setDepositInstallments,
    notes,
    setNotes,
    subtotal,
    total,
    isSubmitting,
    error,
    handleSubmit,
  } = useOrderForm(initialClientId);

  const [clientSelectorVisible, setClientSelectorVisible] = useState(false);
  const [productSelectorVisible, setProductSelectorVisible] = useState(false);

  useEffect(() => {
    if (!initialClientId || selectedClient) {
      return;
    }

    void setClientId(initialClientId);
  }, [initialClientId, selectedClient, setClientId]);

  return (
    <Screen>
      <Header
        title="Nuevo pedido"
        subtitle="Puede quedar pendiente aunque todavia no haya stock comprado."
        rightSlot={
          <Button
            title="Volver"
            size="sm"
            variant="outline"
            onPress={() => router.replace("/orders" as Href)}
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
              <Text className="text-lg font-bold text-foreground">Cliente</Text>
              <Button
                title={selectedClient ? "Cambiar" : "Seleccionar"}
                variant="outline"
                size="sm"
                onPress={() => setClientSelectorVisible(true)}
              />
            </View>
            {selectedClient ? (
              <View>
                <Text className="font-medium text-foreground">{selectedClient.name}</Text>
                {selectedClient.phone ? (
                  <Text className="text-muted-foreground">{selectedClient.phone}</Text>
                ) : null}
              </View>
            ) : (
              <Text className="text-muted-foreground">No se ha seleccionado un cliente.</Text>
            )}
          </Card>

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
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1">
                      <Text className="font-medium text-foreground">{item.variant.productName}</Text>
                      <Text className="text-xs text-muted-foreground">
                        Stock disponible: {item.variant.stock - item.variant.reservedStock}
                      </Text>
                      <CurrencyText amount={item.unitPrice ?? 0} className="text-xs" />
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Button title="-" variant="ghost" size="sm" onPress={() => updateQuantity(item.productVariantId, item.quantity - 1)} />
                      <Text className="w-8 text-center font-bold text-foreground">{item.quantity}</Text>
                      <Button title="+" variant="ghost" size="sm" onPress={() => updateQuantity(item.productVariantId, item.quantity + 1)} />
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
              <Text className="text-muted-foreground">Subtotal</Text>
              <CurrencyText amount={subtotal} />
            </View>
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-muted-foreground">Descuento</Text>
              <View className="w-28">
                <Input
                  keyboardType="numeric"
                  value={discountAmount.toString()}
                  onChangeText={(value) => setDiscountAmount(Number(value) || 0)}
                  placeholder="0"
                />
              </View>
            </View>
            <View className="border-t border-border pt-3">
              <View className="flex-row justify-between">
                <Text className="text-lg font-bold text-foreground">Total</Text>
                <CurrencyText amount={total} className="text-lg font-bold text-primary" />
              </View>
            </View>
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-muted-foreground">Pago inicial</Text>
              <View className="w-28">
                <Input
                  keyboardType="numeric"
                  value={depositAmount.toString()}
                  onChangeText={(value) => setDepositAmount(Number(value) || 0)}
                  placeholder="0"
                />
              </View>
            </View>
            <View className="flex-row gap-2">
              {[2, 3, 4].map((installments) => (
                <Button
                  key={installments}
                  title={`${installments} cuotas`}
                  size="sm"
                  variant={installmentCount === installments ? "primary" : "outline"}
                  onPress={() => setDepositInstallments(installments)}
                  className="flex-1"
                />
              ))}
            </View>
            {installmentCount ? (
              <Text className="text-xs text-muted-foreground">
                Se registrara la cuota 1 de {installmentCount} al crear el pedido.
              </Text>
            ) : null}
          </Card>

          <Card className="mb-8 gap-2 p-4">
            <Text className="text-lg font-bold text-foreground">Notas</Text>
            <Input
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notas internas o instrucciones especiales..."
            />
          </Card>

          <Button
            title="Crear pedido"
            onPress={handleSubmit}
            loading={isSubmitting}
            size="lg"
            className="mb-10"
          />
        </ScrollView>
      </ScreenBody>

      <ClientSelector
        visible={clientSelectorVisible}
        onClose={() => setClientSelectorVisible(false)}
        onSelect={(client) => void setClientId(client.id, client)}
      />
      <ProductSelector
        visible={productSelectorVisible}
        onClose={() => setProductSelectorVisible(false)}
        onSelect={addItem}
      />
    </Screen>
  );
}
