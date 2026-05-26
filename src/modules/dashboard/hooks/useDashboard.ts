import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { getDashboardMetrics } from "../dashboard.service";
import { DashboardMetrics } from "../types";

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar las métricas.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMetrics();
    }, [loadMetrics])
  );

  return {
    metrics,
    isLoading,
    isRefreshing,
    error,
    refresh: () => loadMetrics(true),
  };
}
