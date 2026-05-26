import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from "expo-router";

import {
  Button,
  EmptyState,
  Header,
  LoadingSpinner,
  Screen,
  ScreenBody,
} from "@/components/ui";
import type { Provider } from "@/database/schema";
import { listProviders } from "@/services/providers.service";

import { ProductForm } from "../components";
import { useProductDetails, useProductForm } from "../hooks";

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function EditProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = getIdParam(params.id) ?? "";
  const { isLoading, product } = useProductDetails(id);
  const formState = useProductForm({ mode: "edit", product });
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const goToProducts = () => router.replace("/products");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadProviders() {
        setIsLoadingProviders(true);

        try {
          const result = await listProviders();

          if (isActive) {
            setProviders(result);
          }
        } finally {
          if (isActive) {
            setIsLoadingProviders(false);
          }
        }
      }

      void loadProviders();

      return () => {
        isActive = false;
      };
    }, []),
  );

  if (isLoading || isLoadingProviders) {
    return (
      <Screen scroll={false}>
        <LoadingSpinner className="flex-1" />
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen>
        <Header title="Editar producto" subtitle="No se pudo encontrar el registro." />
        <EmptyState
          title="Producto no encontrado"
          description="El producto no existe o fue eliminado."
          actionLabel="Volver"
          onActionPress={() => router.replace("/products" as Href)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title="Editar producto"
        subtitle={product.name}
        rightSlot={
          <Button
            title="Volver a productos"
            size="sm"
            variant="outline"
            onPress={goToProducts}
          />
        }
      />
      <ScreenBody>
        <ProductForm
          formState={formState}
          providers={providers}
          submitLabel="Guardar cambios"
        />
      </ScreenBody>
    </Screen>
  );
}
