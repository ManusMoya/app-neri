import { Text, View } from "react-native";
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
          onActionPress={() => router.back()}
        />
      </Screen>
    );
  }

  const activeVariants = product.variants.filter((variant) => variant.isActive);

  return (
    <Screen>
      <Header
        title={product.name}
        subtitle={`${product.category.name} · ${product.provider.name}`}
        rightSlot={
          <Button
            title="Editar"
            size="sm"
            variant="outline"
            onPress={() => router.push(`/products/${product.id}/edit` as Href)}
          />
        }
      />

      <ScreenBody>
        <ProductMetricsGrid
          stockTotal={product.stockTotal}
          reservedStock={product.reservedStock}
          availableStock={product.availableStock}
          inventoryValue={product.inventoryValue}
          averageMargin={product.averageMargin}
        />

        <Card className="gap-3">
          <View className="gap-1">
            <Text className="text-xs font-semibold uppercase text-muted-foreground">
              Descripcion
            </Text>
            <Text className="text-sm leading-5 text-foreground">
              {product.description || "Sin descripcion."}
            </Text>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-xs font-semibold uppercase text-muted-foreground">
                Categoria
              </Text>
              <Text className="text-sm font-semibold text-foreground">
                {product.category.name}
              </Text>
            </View>
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
