import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, type Href } from "expo-router";
import { useForm } from "react-hook-form";

import {
  createProductFromForm,
  updateProductFromForm,
} from "@/services/products.api.service";

import type { ProductFormValues, ProductListRecord } from "../types";
import { productFormSchema } from "../utils";

interface UseProductFormOptions {
  mode: "create" | "edit";
  product?: ProductListRecord | null;
}

export const emptyVariantValues = {
  color: "",
  size: "",
  model: "",
  costPrice: 0,
  salePrice: 0,
};

function isEmptyVariant(variant: ProductFormValues["variants"][number]) {
  return !variant.color?.trim()
    && !variant.size?.trim()
    && !variant.model?.trim()
    && variant.costPrice === 0
    && variant.salePrice === 0;
}

function normalizeVariants(values: ProductFormValues): ProductFormValues {
  const variants = values.variants.filter((variant) => !isEmptyVariant(variant));

  return {
    ...values,
    variants,
  };
}

export function useProductForm({ mode, product }: UseProductFormOptions) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const loadedProductId = useRef<string | null>(null);

  const defaultValues = useMemo<ProductFormValues>(
    () => ({
      name: product?.name ?? "",
      providerId: product?.providerId ?? "",
      variants: product?.variants.filter((variant) => variant.isActive).map((variant) => ({
        id: variant.id,
        color: variant.color ?? "",
        size: variant.size ?? "",
        model: variant.model ?? "",
        costPrice: variant.costPrice,
        salePrice: variant.salePrice,
      })) ?? [emptyVariantValues],
    }),
    [product],
  );

  const form = useForm<ProductFormValues>({
    defaultValues,
    resolver: zodResolver(productFormSchema),
  });

  useEffect(() => {
    if (mode === "create") {
      return;
    }

    if (!product || loadedProductId.current === product.id) {
      return;
    }

    loadedProductId.current = product.id;
    form.reset(defaultValues);
  }, [defaultValues, form, mode, product]);

  const submit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      const normalizedValues = normalizeVariants(values);
      const savedProduct =
        mode === "create"
          ? await createProductFromForm(normalizedValues)
          : await updateProductFromForm(product?.id ?? "", normalizedValues);

      router.replace({
        pathname: "/products/[id]",
        params: { id: savedProduct.id },
      } as Href);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo guardar el producto.",
      );
    }
  });

  return {
    form,
    isSubmitting: form.formState.isSubmitting,
    submit,
    submitError,
  };
}
