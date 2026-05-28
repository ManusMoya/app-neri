import type { z } from "zod";

import type { Category, Product, ProductVariant, Provider } from "@/database/schema";

import type { productFormSchema, productVariantFormSchema } from "../utils";

export type ProductVariantFormValues = z.infer<typeof productVariantFormSchema>;
export type ProductFormValues = z.infer<typeof productFormSchema>;

export interface ProductWithDetails extends Product {
  category: Category;
  provider: Provider;
  variants: ProductVariant[];
}

export interface ProductListRecord extends ProductWithDetails {
  stockTotal: number;
  reservedStock: number;
  availableStock: number;
  inventoryValue: number;
  averageMargin: number;
}

export type ProductStockFilter = "all" | "stock" | "to-buy";
