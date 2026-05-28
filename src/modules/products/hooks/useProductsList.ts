import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";

import { listProducts } from "@/services/products.api.service";
import {
  listPendingPurchasesByProvider,
  type PendingPurchaseProviderGroup,
} from "@/services/pending-purchases.service";

import type { ProductStockFilter } from "../types";

export function useProductsList(providerId?: string) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<ProductStockFilter>("all");
  const [products, setProducts] = useState<Awaited<ReturnType<typeof listProducts>>>([]);
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchaseProviderGroup[]>([]);
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
      const [result, pendingResult] = await Promise.all([
        listProducts(searchTerm, filter === "to-buy" ? "all" : filter, providerId),
        listPendingPurchasesByProvider(),
      ]);
      const pendingVariantIds = new Set(
        pendingResult.flatMap((group) => group.products.map((product) => product.productVariantId)),
      );

      setProducts(result);
      setPendingPurchases(
        providerId
          ? pendingResult.filter((group) => group.providerId === providerId)
          : pendingResult,
      );
      if (filter === "to-buy") {
        setProducts(
          result.filter((product) =>
            product.variants.some((variant) => pendingVariantIds.has(variant.id)),
          ),
        );
      }
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

    if (filter === "stock") {
      return "Sin productos con stock";
    }

    if (filter === "to-buy") {
      return "Sin productos a comprar";
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
    pendingPurchases,
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
