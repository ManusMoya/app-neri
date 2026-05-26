import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect, type Href } from "expo-router";

import { Button, EmptyState, Header, LoadingSpinner, Screen, ScreenBody } from "@/components/ui";
import type { Provider } from "@/database/schema";
import { listProviders } from "@/services/providers.service";

import { ProductForm } from "../components";
import { useProductForm } from "../hooks";

export function CreateProductScreen() {
  const router = useRouter();
  const formState = useProductForm({ mode: "create" });
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const goToProducts = () => router.replace("/products");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadProviders() {
        setIsLoadingProviders(true);
        setProvidersError(null);

        try {
          const result = await listProviders();

          if (isActive) {
            setProviders(result);
          }
        } catch (error) {
          if (isActive) {
            setProvidersError(
              error instanceof Error ? error.message : "No se pudieron cargar los proveedores.",
            );
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

  if (isLoadingProviders) {
    return (
      <Screen scroll={false}>
        <LoadingSpinner className="flex-1" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title="Nuevo producto"
        subtitle="Datos, variantes, stock y precios."
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
        {providers.length > 0 ? (
          <ProductForm
            formState={formState}
            providers={providers}
            submitLabel="Crear producto"
          />
        ) : (
          <EmptyState
            title="Primero crea un proveedor"
            description={providersError ?? "No se puede crear un producto sin proveedor."}
            actionLabel="Crear proveedor"
            onActionPress={() => router.push("/providers/create" as Href)}
          />
        )}
      </ScreenBody>
    </Screen>
  );
}
