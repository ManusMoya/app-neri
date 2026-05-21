import { useRouter } from "expo-router";

import { Button, Header, Screen, ScreenBody } from "@/components/ui";

import { ProductForm } from "../components";
import { useProductForm } from "../hooks";

export function CreateProductScreen() {
  const router = useRouter();
  const formState = useProductForm({ mode: "create" });

  return (
    <Screen>
      <Header
        title="Nuevo producto"
        subtitle="Datos, variantes, stock y precios."
        rightSlot={
          <Button title="Cerrar" size="sm" variant="ghost" onPress={() => router.back()} />
        }
      />
      <ScreenBody>
        <ProductForm formState={formState} submitLabel="Crear producto" />
      </ScreenBody>
    </Screen>
  );
}
