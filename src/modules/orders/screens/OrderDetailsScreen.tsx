import React, { useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { Button, Header, Input, LoadingSpinner, Screen, ScreenBody } from "@/components/ui";
import { Card } from "@/components/ui/Card";
import { CurrencyText } from "@/components/ui/CurrencyText";
import { useOrderDetails } from "../hooks/useOrderDetails";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { OrderPaymentStatusBadge } from "../components/OrderPaymentStatusBadge";
import { ORDER_WORKFLOW_STATUS, removeOrder } from "@/services/orders.api.service";

export function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { 
    order, 
    isLoading, 
    error, 
    isActionLoading, 
    handleChangeStatus, 
    handleRegisterPayment 
  } = useOrderDetails(id!);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error || !order) {
    return (
      <Screen>
        <Header
          title="Error"
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
          <Text className="text-error-600">{error || "Pedido no encontrado"}</Text>
        </ScreenBody>
      </Screen>
    );
  }

  const deleteOrder = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await removeOrder(order.id);
      router.replace("/orders" as Href);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Intenta nuevamente.";
      setDeleteError(message);

      if (Platform.OS === "web") {
        globalThis.alert(`No se pudo eliminar\n\n${message}`);
      } else {
        Alert.alert("No se pudo eliminar", message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    const message =
      "Se eliminara el pedido, sus pagos y sus items. Si estaba entregado se devuelve el stock; si estaba reservado se libera la reserva.";

    if (Platform.OS === "web") {
      if (globalThis.confirm(`Eliminar pedido\n\n${message}`)) {
        void deleteOrder();
      }

      return;
    }

    Alert.alert("Eliminar pedido", message, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => void deleteOrder(),
      },
    ]);
  };

  const parsePaymentAmount = () => Number(paymentAmount.replace(/[^\d]/g, ""));

  const setFullBalancePayment = () => {
    setPaymentAmount(order.balanceDue.toString());
    setPaymentNotes("Pago final");
    setPaymentError(null);
  };

  const registerPayment = async () => {
    const amount = parsePaymentAmount();

    if (!Number.isInteger(amount) || amount <= 0) {
      setPaymentError("Ingresa un monto valido.");
      return;
    }

    if (amount > order.balanceDue) {
      setPaymentError("El monto no puede superar el saldo pendiente.");
      return;
    }

    setPaymentError(null);
    const success = await handleRegisterPayment(
      amount,
      "cash",
      paymentNotes.trim() || undefined,
    );

    if (success) {
      setPaymentAmount("");
      setPaymentNotes("");
    }
  };

  return (
    <Screen>
      <Header
        title={`Pedido #${order.id.slice(-6).toUpperCase()}`}
        rightSlot={
          <View className="flex-row gap-2">
            <Button
              title="Volver"
              size="sm"
              variant="outline"
              onPress={() => router.replace("/orders" as Href)}
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
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-sm text-slate-500 uppercase font-bold mb-1">Estado</Text>
                <OrderStatusBadge status={order.status} />
              </View>
              <View className="items-end">
                <Text className="text-sm text-slate-500 uppercase font-bold mb-1">Pago</Text>
                <OrderPaymentStatusBadge status={order.paymentStatus} />
              </View>
            </View>
            <View className="border-t border-slate-100 pt-4">
              <Text className="text-sm text-slate-500 uppercase font-bold mb-1">Cliente</Text>
              <Text className="text-lg font-bold text-slate-900">{order.client.name}</Text>
              {order.client.phone && <Text className="text-slate-500">{order.client.phone}</Text>}
            </View>
          </Card>

          <Card className="p-4 mb-4">
            <Text className="text-sm text-slate-500 uppercase font-bold mb-3">Productos</Text>
            {order.items.map((item) => (
              <View key={item.id} className="flex-row justify-between py-2 border-b border-slate-50">
                <View className="flex-1">
                  <Text className="text-slate-900 font-medium">{item.productName}</Text>
                  <Text className="text-xs text-slate-500">{item.variantLabel || "Estándar"} x {item.quantity}</Text>
                </View>
                <CurrencyText amount={item.lineSubtotal} className="font-bold text-slate-900" />
              </View>
            ))}
            <View className="mt-4 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-slate-600">Subtotal</Text>
                <CurrencyText amount={order.subtotalAmount} />
              </View>
              {order.discountAmount > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-slate-600">Descuento</Text>
                  <CurrencyText amount={-order.discountAmount} className="text-error-600" />
                </View>
              )}
              <View className="flex-row justify-between border-t border-slate-100 pt-2">
                <Text className="text-lg font-bold text-slate-900">Total</Text>
                <CurrencyText amount={order.totalAmount} className="text-lg font-bold text-slate-900" />
              </View>
            </View>
          </Card>

          <Card className="p-4 mb-4">
            <Text className="text-sm text-slate-500 uppercase font-bold mb-3">Finanzas</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-600">Pagado</Text>
              <CurrencyText amount={order.paidAmount} className="text-success-600 font-bold" />
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-600">Saldo Pendiente</Text>
              <CurrencyText amount={order.balanceDue} className="text-error-600 font-bold" />
            </View>
          </Card>

          <Card className="p-4 mb-4">
            <Text className="text-sm text-slate-500 uppercase font-bold mb-3">Cuotas y pagos</Text>
            {order.payments.length > 0 ? (
              <View className="gap-2">
                {order.payments.map((payment, index) => (
                  <View
                    key={payment.id}
                    className="flex-row items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
                  >
                    <View className="min-w-0 flex-1">
                      <Text className="font-semibold text-slate-900">Cuota {index + 1}</Text>
                      <Text className="text-xs text-slate-500">
                        {payment.paidAt.toLocaleDateString()} - {payment.method}
                      </Text>
                      {payment.notes ? (
                        <Text className="text-xs text-slate-500">{payment.notes}</Text>
                      ) : null}
                    </View>
                    <CurrencyText amount={payment.amount} className="font-bold text-slate-900" />
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-slate-500">Todavia no hay pagos registrados.</Text>
            )}
          </Card>

          <View className="mb-8 gap-4">
            <Text className="text-lg font-bold text-slate-900">Acciones</Text>
            
            <View className="flex-row flex-wrap gap-2">
              {order.status === ORDER_WORKFLOW_STATUS.PENDING && (
                <Button 
                  title="Reservar Stock"
                  onPress={() => handleChangeStatus(ORDER_WORKFLOW_STATUS.RESERVED)}
                  loading={isActionLoading}
                  className="flex-1"
                />
              )}
              {(order.status === ORDER_WORKFLOW_STATUS.PENDING || order.status === ORDER_WORKFLOW_STATUS.RESERVED) && (
                <Button 
                  title="Entregar Pedido"
                  onPress={() => handleChangeStatus(ORDER_WORKFLOW_STATUS.DELIVERED)}
                  loading={isActionLoading}
                  variant="primary"
                  className="flex-1"
                />
              )}
              {order.status !== ORDER_WORKFLOW_STATUS.CANCELLED && order.status !== ORDER_WORKFLOW_STATUS.DELIVERED && (
                <Button 
                  title="Cancelar"
                  onPress={() => handleChangeStatus(ORDER_WORKFLOW_STATUS.CANCELLED)}
                  loading={isActionLoading}
                  variant="outline"
                  className="flex-1"
                />
              )}
            </View>

            {order.balanceDue > 0 && (
              <Card className="p-4 mt-2 gap-3">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1">
                    <Text className="font-bold text-slate-900">Registrar pago</Text>
                    <Text className="text-sm text-slate-500">
                      Carga una cuota parcial o liquida el saldo pendiente.
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs font-bold uppercase text-slate-500">Saldo</Text>
                    <CurrencyText amount={order.balanceDue} className="font-bold text-error-600" />
                  </View>
                </View>
                <Input
                  label="Monto que pago el cliente"
                  value={paymentAmount}
                  onChangeText={(value) => {
                    setPaymentAmount(value.replace(/[^\d]/g, ""));
                    setPaymentError(null);
                  }}
                  keyboardType="numeric"
                  placeholder="Ej: 15000"
                  error={paymentError ?? undefined}
                />
                <Input
                  label="Nota opcional"
                  value={paymentNotes}
                  onChangeText={setPaymentNotes}
                  placeholder="Ej: cuota 1 de 3"
                />
                <View className="flex-row gap-2">
                  <Button
                    title="Registrar cuota"
                    onPress={registerPayment}
                    loading={isActionLoading}
                    className="flex-1"
                  />
                  <Button
                    title="Pagar saldo"
                    onPress={setFullBalancePayment}
                    loading={isActionLoading}
                    variant="outline"
                    className="flex-1"
                  />
                </View>
              </Card>
            )}
          </View>
        </ScrollView>
      </ScreenBody>
    </Screen>
  );
}
