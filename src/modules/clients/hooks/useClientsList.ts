import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";

import { listClients } from "@/services/clients.service";

export function useClientsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<Awaited<ReturnType<typeof listClients>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClients = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const result = await listClients(searchTerm);
      setClients(result);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "No se pudieron cargar los clientes.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchTerm]);

  useFocusEffect(
    useCallback(() => {
      void loadClients();
    }, [loadClients]),
  );

  const emptyTitle = useMemo(
    () => (searchTerm.trim() ? "Sin resultados" : "Sin clientes cargados"),
    [searchTerm],
  );

  return {
    clients,
    emptyTitle,
    error,
    isLoading,
    isRefreshing,
    refresh: () => loadClients(true),
    searchTerm,
    setSearchTerm,
  };
}
