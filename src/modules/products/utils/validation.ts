import { z } from "zod";

const optionalText = z.string().trim().optional();

export const productVariantFormSchema = z.object({
  id: z.string().optional(),
  color: optionalText,
  size: optionalText,
  model: optionalText,
  sku: optionalText,
  barcode: optionalText,
  stock: z.number().int("Debe ser un entero.").min(0, "No puede ser negativo."),
  reservedStock: z.number().int("Debe ser un entero.").min(0, "No puede ser negativo."),
  minimumStock: z.number().int("Debe ser un entero.").min(0, "No puede ser negativo."),
  costPrice: z.number().int("Debe ser un entero.").min(0, "No puede ser negativo."),
  salePrice: z.number().int("Debe ser un entero.").min(0, "No puede ser negativo."),
}).refine((variant) => variant.reservedStock <= variant.stock, {
  message: "El reservado no puede superar el stock.",
  path: ["reservedStock"],
});

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido.").max(100),
  categoryName: z.string().trim().min(1, "La categoria es requerida.").max(80),
  providerName: z.string().trim().min(1, "El proveedor es requerido.").max(100),
  description: z.string().trim().optional(),
  variants: z.array(productVariantFormSchema).min(1, "Agrega al menos una variante."),
});
