import { useFieldArray, type Control } from "react-hook-form";

import type { ProductFormValues } from "../types";
import { emptyVariantValues } from "./useProductForm";

export function useVariantForm(control: Control<ProductFormValues>) {
  const fieldArray = useFieldArray({
    control,
    name: "variants",
  });

  return {
    ...fieldArray,
    addVariant: () => fieldArray.append({ ...emptyVariantValues }),
  };
}
