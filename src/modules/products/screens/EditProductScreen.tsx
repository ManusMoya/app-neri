import { useLocalSearchParams, useRouter } from "expo-router";

import {
  Button,
  EmptyState,
  Header,
  LoadingSpinner,
  Screen,
  ScreenBody,
} from "@/components/ui";

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
        <Header title="Editar producto" subtitle="No se pudo encontrar el registro." />
        <EmptyState
          title="Producto no encontrado"
          description="El producto no existe o fue eliminado."
          actionLabel="Volver"
          onActionPress={() => router.back()}
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
          <Button title="Cerrar" size="sm" variant="ghost" onPress={() => router.back()} />
        }
      />
      <ScreenBody>
        <ProductForm formState={formState} submitLabel="Guardar cambios" />
      </ScreenBody>
    </Screen>
  );
}
