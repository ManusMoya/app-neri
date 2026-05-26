import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import {
  Button,
  EmptyState,
  Header,
  LoadingSpinner,
  Screen,
  ScreenBody,
} from "@/components/ui";

import { ProviderForm } from "../components";
import { useProviderDetails, useProviderForm } from "../hooks";

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function EditProviderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = getIdParam(params.id) ?? "";
  const { details, isLoading } = useProviderDetails(id);
  const formState = useProviderForm({ mode: "edit", provider: details?.provider });

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
        <Header title="Editar proveedor" subtitle="No se pudo encontrar el registro." />
        <EmptyState
          title="Proveedor no encontrado"
          description="El proveedor no existe o fue eliminado."
          actionLabel="Volver"
          onActionPress={() => router.replace("/providers" as Href)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title="Editar proveedor"
        subtitle={details.provider.name}
        rightSlot={
          <Button
            title="Volver"
            size="sm"
            variant="outline"
            onPress={() => router.replace(`/providers/${details.provider.id}` as Href)}
          />
        }
      />
      <ScreenBody>
        <ProviderForm formState={formState} submitLabel="Guardar cambios" />
      </ScreenBody>
    </Screen>
  );
}
