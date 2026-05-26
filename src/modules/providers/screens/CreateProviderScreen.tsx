import { useRouter, type Href } from "expo-router";

import { Button, Header, Screen, ScreenBody } from "@/components/ui";

import { ProviderForm } from "../components";
import { useProviderForm } from "../hooks";

export function CreateProviderScreen() {
  const router = useRouter();
  const formState = useProviderForm({ mode: "create" });

  return (
    <Screen>
      <Header
        title="Nuevo proveedor"
        subtitle="Carga los datos principales de contacto."
        rightSlot={
          <Button
            title="Volver"
            size="sm"
            variant="outline"
            onPress={() => router.replace("/providers" as Href)}
          />
        }
      />
      <ScreenBody>
        <ProviderForm formState={formState} submitLabel="Crear proveedor" />
      </ScreenBody>
    </Screen>
  );
}
