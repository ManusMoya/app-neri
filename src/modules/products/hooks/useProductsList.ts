import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";

import { listProducts } from "@/services/products.service";

import type { ProductStockFilter } from "../types";

export function useProductsList(providerId?: string) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<ProductStockFilter>("all");
  const [products, setProducts] = useState<Awaited<ReturnType<typeof listProducts>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const result = await listProducts(searchTerm, filter, providerId);
      setProducts(result);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "No se pudieron cargar los productos.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filter, searchTerm, providerId]);

  useFocusEffect(
    useCallback(() => {
      void loadProducts();
    }, [loadProducts]),
  );

  const emptyTitle = useMemo(() => {
    if (searchTerm.trim()) {
      return "Sin resultados";
    }

    if (filter === "out") {
      return "Sin productos sin stock";
    }

    if (filter === "low") {
      return "Sin productos con stock bajo";
    }

    return "Sin productos cargados";
  }, [filter, searchTerm]);

  return {
    emptyTitle,
    error,
    filter,
    isLoading,
    isRefreshing,
    products,
    refresh: () => loadProducts(true),
    resetFilters: () => {
      setSearchTerm("");
      setFilter("all");
    },
    searchTerm,
    setFilter,
    setSearchTerm,
  };
}
