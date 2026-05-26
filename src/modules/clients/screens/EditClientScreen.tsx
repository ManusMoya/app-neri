import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import {
  Button,
  EmptyState,
  Header,
  LoadingSpinner,
  Screen,
  ScreenBody,
} from "@/components/ui";

import { ClientForm } from "../components";
import { useClientDetails, useClientForm } from "../hooks";

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function EditClientScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = getIdParam(params.id) ?? "";
  const { details, isLoading } = useClientDetails(id);
  const formState = useClientForm({ mode: "edit", client: details?.client });

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
        <Header title="Editar cliente" subtitle="No se pudo encontrar el registro." />
        <EmptyState
          title="Cliente no encontrado"
          description="El cliente no existe o fue eliminado."
          actionLabel="Volver"
          onActionPress={() => router.replace("/clients" as Href)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title="Editar cliente"
        subtitle={details.client.name}
        rightSlot={
          <Button
            title="Volver"
            size="sm"
            variant="outline"
            onPress={() => router.replace(`/clients/${details.client.id}` as Href)}
          />
        }
      />
      <ScreenBody>
        <ClientForm formState={formState} submitLabel="Guardar cambios" />
      </ScreenBody>
    </Screen>
  );
}
