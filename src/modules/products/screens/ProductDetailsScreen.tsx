import { useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import {
  Button,
  Card,
  EmptyState,
  Header,
  LoadingSpinner,
  Screen,
  ScreenBody,
  SectionTitle,
} from "@/components/ui";
import { deleteProduct } from "@/services/products.api.service";

import { ProductMetricsGrid, VariantCard } from "../components";
import { useProductDetails } from "../hooks";

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function ProductDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = getIdParam(params.id) ?? "";
  const { error, isLoading, product, reload } = useProductDetails(id);
  const [isDeleting, setIsDeleting] = useState(false);

  const executeDelete = async () => {
    if (!product || isDeleting) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteProduct(product.id);
      router.replace("/products" as Href);
    } catch (deleteError) {
      const message = deleteError instanceof Error
        ? deleteError.message
        : "Intentalo nuevamente.";

      if (Platform.OS === "web") {
        window.alert(`No se pudo eliminar\n\n${message}`);
      } else {
        Alert.alert("No se pudo eliminar", message);
      }

      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    if (!product || isDeleting) {
      return;
    }

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Eliminar producto\n\nEl producto dejara de aparecer en el catalogo. El historial de ventas y compras se conserva.",
      );

      if (confirmed) {
        void executeDelete();
      }

      return;
    }

    Alert.alert(
      "Eliminar producto",
      "El producto dejara de aparecer en el catalogo. El historial de ventas y compras se conserva.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => void executeDelete(),
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <Screen scroll={false}>
        <LoadingSpinner className="flex-1" />
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen>
        <Header title="Producto" subtitle="No se pudo encontrar el registro." />
        <EmptyState
          title="Producto no encontrado"
          description={error ?? "El producto no existe o fue eliminado."}
          actionLabel="Volver"
          onActionPress={() => router.replace("/products" as Href)}
        />
      </Screen>
    );
  }

  const activeVariants = product.variants.filter((variant) => variant.isActive);

  return (
    <Screen>
      <Header
        title={product.name}
        subtitle={product.provider.name}
        rightSlot={
          <View className="flex-row gap-2">
            <Button
              title="Ver todos"
              size="sm"
              variant="ghost"
              onPress={() => router.replace("/products" as Href)}
            />
            <Button
              title="Editar"
              size="sm"
              variant="outline"
              onPress={() => router.push(`/products/${product.id}/edit` as Href)}
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
        <ProductMetricsGrid
          stockTotal={product.stockTotal}
          inventoryValue={product.inventoryValue}
          averageMargin={product.averageMargin}
        />

        <Card className="gap-3">
          <View className="flex-row gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-xs font-semibold uppercase text-muted-foreground">
                Proveedor
              </Text>
              <Text className="text-sm font-semibold text-foreground">
                {product.provider.name}
              </Text>
            </View>
          </View>
        </Card>

        <View className="gap-3">
          <SectionTitle
            title="Variantes"
            subtitle="Stock disponible, precios y margen por variante."
          />
          {activeVariants.length > 0 ? (
            activeVariants.map((variant) => (
              <VariantCard key={variant.id} variant={variant} />
            ))
          ) : (
            <EmptyState
              title="Sin variantes activas"
              description="Edita el producto para agregar variantes de stock."
            />
          )}
        </View>

        <Card className="gap-2">
          <Text className="text-base font-bold text-foreground">Analytics</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Este punto queda preparado para historial de stock, sincronizacion y
            reportes.
          </Text>
          <Button title="Actualizar" variant="outline" onPress={reload} />
        </Card>
      </ScreenBody>
    </Screen>
  );
}
