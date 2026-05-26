import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, type Href } from "expo-router";
import { useForm } from "react-hook-form";

import {
  createProductFromForm,
  updateProductFromForm,
} from "@/services/products.service";

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

export function useProductForm({ mode, product }: UseProductFormOptions) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const submit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      const savedProduct =
        mode === "create"
          ? await createProductFromForm(values)
          : await updateProductFromForm(product?.id ?? "", values);

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
