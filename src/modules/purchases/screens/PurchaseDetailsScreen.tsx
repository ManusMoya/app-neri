import React, { useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { Badge, Button, Header, LoadingSpinner, Screen, ScreenBody } from "@/components/ui";
import { Card } from "@/components/ui/Card";
import { CurrencyText } from "@/components/ui/CurrencyText";
import { removePurchase } from "@/services/purchases.api.service";

import { usePurchaseDetails } from "../hooks/usePurchaseDetails";

export function PurchaseDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { purchase, isLoading, error } = usePurchaseDetails(id!);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Screen scroll={false}>
        <LoadingSpinner className="flex-1" />
      </Screen>
    );
  }

  if (error || !purchase) {
    return (
      <Screen>
        <Header
          title="Error"
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
          <Text>{error || "Compra no encontrada"}</Text>
        </ScreenBody>
      </Screen>
    );
  }

  const deletePurchase = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await removePurchase(purchase.id);
      router.replace("/purchases");
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Intenta nuevamente.";
      setDeleteError(message);
      Alert.alert("No se pudo eliminar", message);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    const message =
      "Se descontara del stock todo lo ingresado por esta compra. Esta accion no se puede deshacer.";

    if (Platform.OS === "web") {
      if (globalThis.confirm(`Eliminar compra\n\n${message}`)) {
        void deletePurchase();
      }

      return;
    }

    Alert.alert("Eliminar compra", message, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => void deletePurchase(),
      },
    ]);
  };

  const purchasedAt = new Date(purchase.purchasedAt).toLocaleDateString("es-AR");
  const hasPaymentPending = purchase.balanceDue > 0;

  return (
    <Screen>
      <Header
        title={`Compra #${purchase.id.slice(-6).toUpperCase()}`}
        rightSlot={
          <View className="flex-row gap-2">
            <Button
              title="Volver"
              size="sm"
              variant="outline"
              onPress={() => router.replace("/purchases" as Href)}
            />
            <Button
              title="Eliminar"
              size="sm"
              variant="danger"
              loading={isDeleting}
              onPress={confirmDelete}
            />
          </View>
        }
      />
      <ScreenBody>
        {deleteError ? (
          <Text className="text-sm font-medium text-danger">{deleteError}</Text>
        ) : null}

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <Card className="mb-4 gap-3">
            <View className="flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1 gap-1">
                <Text className="text-xs font-semibold uppercase text-muted-foreground">
                  Proveedor
                </Text>
                <Text className="text-lg font-bold text-foreground">{purchase.provider.name}</Text>
                <Text className="text-sm text-muted-foreground">{purchasedAt}</Text>
              </View>
              <Badge label="Recibida" tone="success" />
            </View>
            {purchase.reference ? (
              <View className="rounded-md bg-background px-3 py-2">
                <Text className="text-xs font-semibold uppercase text-muted-foreground">
                  Referencia
                </Text>
                <Text className="text-sm font-semibold text-foreground">{purchase.reference}</Text>
              </View>
            ) : null}
          </Card>

          <View className="mb-4 flex-row gap-3">
            <Card className="flex-1 gap-1">
              <Text className="text-xs font-semibold uppercase text-muted-foreground">Total</Text>
              <CurrencyText amount={purchase.totalAmount} className="text-xl font-bold" />
            </Card>
            <Card className="flex-1 gap-1">
              <Text className="text-xs font-semibold uppercase text-muted-foreground">
                {hasPaymentPending ? "Pendiente" : "Pagado"}
              </Text>
              <CurrencyText
                amount={hasPaymentPending ? purchase.balanceDue : purchase.paidAmount}
                className={`text-xl font-bold ${hasPaymentPending ? "text-danger" : "text-success"}`}
              />
            </Card>
          </View>

          <Card className="mb-4 gap-3">
            <Text className="text-sm font-bold uppercase text-muted-foreground">
              Productos recibidos
            </Text>
            {purchase.items.map((item) => (
              <View key={item.id} className="gap-3 border-b border-border py-3 last:border-b-0">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1">
                    <Text className="text-base font-bold text-foreground" numberOfLines={2}>
                      {item.productName}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {item.variantLabel}
                      {item.sku ? ` - SKU ${item.sku}` : ""}
                    </Text>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="text-xs font-semibold uppercase text-muted-foreground">
                      x{item.quantity}
                    </Text>
                    <CurrencyText amount={item.lineTotal} className="font-bold" />
                  </View>
                </View>

                <View className="gap-2 rounded-md bg-background p-3">
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-muted-foreground">Costo unitario base</Text>
                    <CurrencyText amount={item.baseCost} className="text-xs font-semibold" />
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-muted-foreground">Envio asignado</Text>
                    <CurrencyText amount={item.shippingCost} className="text-xs font-semibold" />
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-muted-foreground">Costo real unitario</Text>
                    <CurrencyText amount={item.realCost} className="text-xs font-semibold" />
                  </View>
                </View>
              </View>
            ))}
            {purchase.items.length === 0 ? (
              <Text className="text-sm text-muted-foreground">
                Esta compra no tiene productos asociados.
              </Text>
            ) : null}
            <View className="mt-4 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-muted-foreground">Subtotal</Text>
                <CurrencyText amount={purchase.subtotalAmount} />
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted-foreground">Envio</Text>
                <CurrencyText amount={purchase.shippingAmount} />
              </View>
              <View className="flex-row justify-between border-t border-border pt-2">
                <Text className="text-lg font-bold text-foreground">Total</Text>
                <CurrencyText amount={purchase.totalAmount} className="text-lg font-bold" />
              </View>
            </View>
          </Card>

          <Card className="mb-4 gap-3">
            <Text className="text-sm font-bold uppercase text-muted-foreground">Pagos</Text>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Monto pagado</Text>
              <CurrencyText amount={purchase.paidAmount} className="font-bold text-success" />
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Saldo pendiente</Text>
              <CurrencyText amount={purchase.balanceDue} className="font-bold text-danger" />
            </View>
          </Card>

          {purchase.notes ? (
            <Card className="mb-8 gap-2">
              <Text className="text-sm font-bold uppercase text-muted-foreground">Notas</Text>
              <Text className="text-sm leading-5 text-foreground">{purchase.notes}</Text>
            </Card>
          ) : null}
        </ScrollView>
      </ScreenBody>
    </Screen>
  );
}
