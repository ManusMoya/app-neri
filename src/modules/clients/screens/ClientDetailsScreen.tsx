import { Pressable, Text, View } from "react-native";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import {
  Button,
  Card,
  CurrencyText,
  EmptyState,
  Header,
  LoadingSpinner,
  Screen,
  ScreenBody,
} from "@/components/ui";

import { ClientSummaryCard } from "../components";
import { useClientDetails } from "../hooks";
import { OrderPaymentStatusBadge, OrderStatusBadge } from "@/modules/orders/components";

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function ClientDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = getIdParam(params.id) ?? "";
  const { details, error, isLoading, reload } = useClientDetails(id);

  if (isLoading) {
    return (
      <Screen scroll={false}>
        <LoadingSpinner className="flex-1" />
      </Screen>
    );
  }

  if (!details) {
    return (
      <Screen>
        <Header title="Cliente" subtitle="No se pudo encontrar el registro." />
        <EmptyState
          title="Cliente no encontrado"
          description={error ?? "El cliente no existe o fue eliminado."}
          actionLabel="Volver"
          onActionPress={() => router.replace("/clients" as Href)}
        />
      </Screen>
    );
  }

  const { client, debt, orders, ordersCount } = details;
  const canOpenWhatsapp = Boolean(client.whatsappLink);

  return (
    <Screen>
      <Header
        title={client.name}
        subtitle={client.phone || "Sin telefono cargado"}
        rightSlot={
          <View className="flex-row gap-2">
            <Button
              title="Volver"
              size="sm"
              variant="ghost"
              onPress={() => router.replace("/clients" as Href)}
            />
            <Button
              title="Editar"
              size="sm"
              variant="outline"
              onPress={() => router.push(`/clients/${client.id}/edit` as Href)}
            />
          </View>
        }
      />

      <ScreenBody>
        <ClientSummaryCard debt={debt} ordersCount={ordersCount} />

        <Card className="gap-4">
          <View className="gap-1">
            <Text className="text-xs font-semibold uppercase text-muted-foreground">
              Contacto
            </Text>
            <Text className="text-base font-semibold text-foreground">
              {client.phone || "Sin telefono"}
            </Text>
          </View>

          <Button
            title="Abrir WhatsApp"
            variant="secondary"
            disabled={!canOpenWhatsapp}
            onPress={() => {
              if (client.whatsappLink) {
                void Linking.openURL(client.whatsappLink);
              }
            }}
          />
        </Card>

        <Card className="gap-2">
          <Text className="text-base font-bold text-foreground">Historial</Text>
          {orders.length > 0 ? (
            <View className="gap-3">
              {orders.map((order) => (
                <Pressable
                  key={order.id}
                  className="gap-2 border-b border-border pb-3 last:border-b-0 last:pb-0"
                  onPress={() => router.push(`/orders/${order.id}` as Href)}
                >
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="gap-1">
                      <Text className="text-sm font-bold text-foreground">
                        Pedido #{order.id.slice(-6).toUpperCase()}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {order.orderedAt.toLocaleDateString()}
                      </Text>
                    </View>
                    <CurrencyText amount={order.totalAmount} className="text-sm font-bold" />
                  </View>
                  <View className="flex-row flex-wrap items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <OrderPaymentStatusBadge status={order.paymentStatus} />
                    {order.balanceDue > 0 ? (
                      <Text className="text-xs font-semibold text-danger">
                        Saldo: {order.balanceDue}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text className="text-sm leading-5 text-muted-foreground">
              Este cliente todavia no tiene pedidos registrados.
            </Text>
          )}
          <Button title="Actualizar" variant="outline" onPress={reload} />
        </Card>
      </ScreenBody>
    </Screen>
  );
}
