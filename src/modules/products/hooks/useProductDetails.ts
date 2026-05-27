import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getProductDetails } from "@/services/products.api.service";
import type { ProductListRecord } from "../types";

export function useProductDetails(id: string) {
  const [product, setProduct] = useState<ProductListRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await getProductDetails(id);
      setProduct(result);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "No se pudo cargar el producto.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadProduct();
    }, [loadProduct]),
  );

  return {
    error,
    isLoading,
    product,
    reload: loadProduct,
  };
}
