import React, { useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { Button, Header, LoadingSpinner, Screen, ScreenBody } from "@/components/ui";
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

  if (isLoading) return <LoadingSpinner />;
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
      const message =
        deleteError instanceof Error ? deleteError.message : "Intenta nuevamente.";
      setDeleteError(message);
      Alert.alert(
        "No se pudo eliminar",
        message,
      );
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

    Alert.alert(
      "Eliminar compra",
      message,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => void deletePurchase(),
        },
      ],
    );
  };

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

        <ScrollView className="flex-1">
          <Card className="p-4 mb-4">
            <Text className="text-sm text-slate-500 uppercase font-bold mb-1">Proveedor</Text>
            <Text className="text-lg font-bold text-slate-900">{purchase.provider.name}</Text>
            <Text className="text-slate-500">{new Date(purchase.purchasedAt).toLocaleDateString()}</Text>
          </Card>

          <Card className="p-4 mb-4">
            <Text className="text-sm text-slate-500 uppercase font-bold mb-3">Productos Recibidos</Text>
            {purchase.items.map((item) => (
              <View key={item.id} className="gap-3 border-b border-slate-100 py-3 last:border-b-0">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1">
                    <Text className="text-base font-bold text-slate-900" numberOfLines={2}>
                      {item.productName}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {item.variantLabel}
                      {item.sku ? ` · SKU ${item.sku}` : ""}
                    </Text>
                  </View>
                  <CurrencyText amount={item.lineTotal} className="font-bold text-slate-900" />
                </View>

                <View className="gap-1 rounded-md bg-slate-50 p-3">
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-500">Cantidad</Text>
                    <Text className="text-xs font-semibold text-slate-700">{item.quantity}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-500">Costo unitario base</Text>
                    <CurrencyText amount={item.baseCost} className="text-xs font-semibold text-slate-700" />
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-500">Flete asignado</Text>
                    <CurrencyText amount={item.shippingCost} className="text-xs font-semibold text-slate-700" />
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-500">Costo real unitario</Text>
                    <CurrencyText amount={item.realCost} className="text-xs font-semibold text-slate-700" />
                  </View>
                </View>
              </View>
            ))}
            <View className="mt-4 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-slate-600">Subtotal</Text>
                <CurrencyText amount={purchase.subtotalAmount} />
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-600">Envío</Text>
                <CurrencyText amount={purchase.shippingAmount} />
              </View>
              <View className="flex-row justify-between border-t border-slate-100 pt-2">
                <Text className="text-lg font-bold text-slate-900">Total</Text>
                <CurrencyText amount={purchase.totalAmount} className="text-lg font-bold text-slate-900" />
              </View>
            </View>
          </Card>

          <Card className="p-4 mb-8">
            <Text className="text-sm text-slate-500 uppercase font-bold mb-3">Pagos</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-600">Monto Pagado</Text>
              <CurrencyText amount={purchase.paidAmount} className="text-success-600 font-bold" />
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-600">Saldo Pendiente</Text>
              <CurrencyText amount={purchase.balanceDue} className="text-error-600 font-bold" />
            </View>
          </Card>
        </ScrollView>
      </ScreenBody>
    </Screen>
  );
}
