import { useRouter } from "expo-router";

import { Button, Header, Screen, ScreenBody } from "@/components/ui";

import { ClientForm } from "../components";
import { useClientForm } from "../hooks";

export function CreateClientScreen() {
  const router = useRouter();
  const formState = useClientForm({ mode: "create" });

  return (
    <Screen>
      <Header
        title="Nuevo cliente"
        subtitle="Datos basicos para ventas, deuda y contacto."
        rightSlot={
          <Button title="Cerrar" size="sm" variant="ghost" onPress={() => router.back()} />
        }
      />
      <ScreenBody>
        <ClientForm formState={formState} submitLabel="Crear cliente" />
      </ScreenBody>
    </Screen>
  );
}
