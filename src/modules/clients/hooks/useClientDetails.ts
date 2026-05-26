import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getClientDetails, type ClientDetails } from "@/services/clients.api.service";

export function useClientDetails(id: string) {
  const [details, setDetails] = useState<ClientDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await getClientDetails(id);
      setDetails(result);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "No se pudo cargar el cliente.",
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
