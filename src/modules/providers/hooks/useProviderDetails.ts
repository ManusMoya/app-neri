import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getProviderDetails, type ProviderDetails } from "@/services/providers.service";

export function useProviderDetails(id: string) {
  const [details, setDetails] = useState<ProviderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!id) {
      setDetails(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setDetails(await getProviderDetails(id));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "No se pudo cargar el proveedor.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadDetails();
    }, [loadDetails]),
  );

  return {
    details,
    error,
    isLoading,
    reload: loadDetails,
  };
}
