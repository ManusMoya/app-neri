import { Text, View } from "react-native";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import {
  Button,
  Card,
  EmptyState,
  Header,
  LoadingSpinner,
  Screen,
  ScreenBody,
} from "@/components/ui";

import { ClientSummaryCard } from "../components";
import { useClientDetails } from "../hooks";

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
          onActionPress={() => router.back()}
        />
      </Screen>
    );
  }

  const { client, debt, ordersCount } = details;
  const canOpenWhatsapp = Boolean(client.whatsappLink);

  return (
    <Screen>
      <Header
        title={client.name}
        subtitle={client.phone || "Sin telefono cargado"}
        rightSlot={
          <Button
            title="Editar"
            size="sm"
            variant="outline"
            onPress={() => router.push(`/clients/${client.id}/edit` as Href)}
          />
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
          <Text className="text-sm leading-5 text-muted-foreground">
            Los pedidos, balances y actividad del cliente se conectaran desde este
            punto.
          </Text>
          <Button title="Actualizar" variant="outline" onPress={reload} />
        </Card>
      </ScreenBody>
    </Screen>
  );
}
