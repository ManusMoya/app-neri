import { useState } from "react";
import { Alert, Platform, Pressable, Text, View } from "react-native";
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
import { removeProvider } from "@/services/providers.api.service";

import { ProviderSummaryCard } from "../components";
import { useProviderDetails } from "../hooks";

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function ProviderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = getIdParam(params.id) ?? "";
  const { details, error, isLoading, reload } = useProviderDetails(id);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
        <Header title="Proveedor" subtitle="No se pudo encontrar el registro." />
        <EmptyState
          title="Proveedor no encontrado"
          description={error ?? "El proveedor no existe o fue eliminado."}
          actionLabel="Volver"
          onActionPress={() => router.replace("/providers" as Href)}
        />
      </Screen>
    );
  }

  const { provider, products, productsCount, purchasesCount } = details;
  const canDelete = purchasesCount === 0;
  const canOpenWhatsapp = Boolean(provider.whatsappLink);

  const deleteProvider = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await removeProvider(provider.id);
      router.replace("/providers" as Href);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : "Intenta nuevamente.";
      setDeleteError(message);
      Alert.alert("No se pudo eliminar", message);
      void reload();
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    const message = `Vas a eliminar a ${provider.name}. Esta accion no se puede deshacer.`;

    if (Platform.OS === "web") {
      if (globalThis.confirm(`Eliminar proveedor\n\n${message}`)) {
        void deleteProvider();
      }

      return;
    }

    Alert.alert(
      "Eliminar proveedor",
      message,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => void deleteProvider(),
        },
      ],
    );
  };

  return (
    <Screen>
      <Header
        title={provider.name}
        subtitle={provider.phone || provider.email || "Sin contacto cargado"}
        rightSlot={
          <View className="flex-row gap-2">
            <Button
              title="Volver"
              size="sm"
              variant="ghost"
              onPress={() => router.replace("/providers" as Href)}
            />
            <Button
              title="Editar"
              size="sm"
              variant="outline"
              onPress={() => router.push(`/providers/${provider.id}/edit` as Href)}
            />
          </View>
        }
      />

      <ScreenBody>
        {deleteError ? (
          <Text className="text-sm font-medium text-danger">{deleteError}</Text>
        ) : null}

        <ProviderSummaryCard productsCount={productsCount} purchasesCount={purchasesCount} />

        {products.length > 0 ? (
          <Button
            title="Ver en productos"
            variant="outline"
            onPress={() => router.push(`/products?providerId=${provider.id}` as Href)}
          />
        ) : null}

        <Card className="gap-4">
          <View className="gap-1">
            <Text className="text-xs font-semibold uppercase text-muted-foreground">
              Contacto
            </Text>
            <Text className="text-base font-semibold text-foreground">
              {provider.phone || "Sin telefono"}
            </Text>
            {provider.email ? (
              <Text className="text-sm text-muted-foreground">{provider.email}</Text>
            ) : null}
            {provider.address ? (
              <Text className="text-sm text-muted-foreground">{provider.address}</Text>
            ) : null}
          </View>

          <Button
            title="Abrir WhatsApp"
            variant="secondary"
            disabled={!canOpenWhatsapp}
            onPress={() => {
              if (provider.whatsappLink) {
                void Linking.openURL(provider.whatsappLink);
              }
            }}
          />
        </Card>

        {provider.notes ? (
          <Card className="gap-2">
            <Text className="text-base font-bold text-foreground">Notas</Text>
            <Text className="text-sm leading-5 text-muted-foreground">{provider.notes}</Text>
          </Card>
        ) : null}

        <Card className="gap-3">
          <Text className="text-base font-bold text-foreground">Productos asociados</Text>
          {products.length > 0 ? (
            <View className="gap-3">
              {products.map((product) => (
                <Pressable
                  key={product.id}
                  className="flex-row items-center justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0"
                  onPress={() => router.push(`/products/${product.id}` as Href)}
                >
                  <View className="min-w-0 flex-1">
                    <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                      {product.description || "Sin descripcion"}
                    </Text>
                  </View>
                  <Text className="text-sm font-bold text-foreground">
                    Stock {product.stockTotal}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-muted-foreground">
              No hay productos asociados a este proveedor.
            </Text>
          )}
        </Card>

        <Card className="gap-3">
          <Text className="text-base font-bold text-foreground">Eliminar proveedor</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Solo se bloquea si tiene compras asociadas. Si tiene productos,
            quedaran asignados a Proveedor eliminado y seguiran visibles en Productos.
          </Text>
          <Button
            title="Eliminar"
            variant="danger"
            disabled={!canDelete}
            loading={isDeleting}
            onPress={confirmDelete}
          />
        </Card>
      </ScreenBody>
    </Screen>
  );
}
