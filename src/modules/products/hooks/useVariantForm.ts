import { useFieldArray, type Control } from "react-hook-form";

import type { ProductFormValues, ProductVariantFormValues } from "../types";
import { emptyVariantValues } from "./useProductForm";

export interface VariantRangeInput {
  color?: string;
  costPrice: number;
  model?: string;
  salePrice: number;
  sizeRange: string;
}

function expandSizeRange(sizeRange: string) {
  const normalized = sizeRange
    .trim()
    .replace(/^talles?\s*/i, "")
    .replace(/^talle\/s\s*/i, "");
  const rangeMatch = normalized.match(/^(\d+)\s*-\s*(\d+)$/);

  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);

    if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || end - start > 80) {
      throw new Error("La gama de talles no es valida.");
    }

    return Array.from({ length: end - start + 1 }, (_, index) => String(start + index));
  }

  const list = normalized
    .split(/[,\s]+/)
    .map((size) => size.trim())
    .filter(Boolean);

  if (list.length === 0) {
    throw new Error("Ingresa una gama de talles.");
  }

  return Array.from(new Set(list));
}

export function useVariantForm(control: Control<ProductFormValues>) {
  const fieldArray = useFieldArray({
    control,
    name: "variants",
  });

  return {
    ...fieldArray,
    addVariant: () => fieldArray.append({ ...emptyVariantValues }),
    addVariantRange: (input: VariantRangeInput) => {
      const variants: ProductVariantFormValues[] = expandSizeRange(input.sizeRange).map((size) => ({
        color: input.color?.trim() ?? "",
        size,
        model: input.model?.trim() ?? "",
        costPrice: input.costPrice,
        salePrice: input.salePrice,
      }));

      for (const variant of variants) {
        fieldArray.append(variant);
      }
    },
  };
}
