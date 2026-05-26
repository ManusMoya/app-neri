import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";

import { listProviders } from "@/services/providers.service";

import type { ProviderRecord } from "../types";

export function useProvidersList() {
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProviders = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      setProviders(await listProviders(searchTerm));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "No se pudieron cargar los proveedores.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchTerm]);

  useFocusEffect(
    useCallback(() => {
      void loadProviders();
    }, [loadProviders]),
  );

  const emptyTitle = useMemo(
    () => (searchTerm.trim() ? "Sin resultados" : "Todavia no hay proveedores"),
    [searchTerm],
  );

  return {
    providers,
    emptyTitle,
    error,
    isLoading,
    isRefreshing,
    refresh: () => loadProviders(true),
    searchTerm,
    setSearchTerm,
  };
}
