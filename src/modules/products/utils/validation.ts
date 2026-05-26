import { z } from "zod";

const optionalText = z.string().trim().optional();

export const productVariantFormSchema = z.object({
  id: z.string().optional(),
  color: optionalText,
  size: optionalText,
  model: optionalText,
  costPrice: z.number().int("Debe ser un entero.").min(0, "No puede ser negativo."),
  salePrice: z.number().int("Debe ser un entero.").min(0, "No puede ser negativo."),
});

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido.").max(100),
  providerId: z.string().trim().min(1, "El proveedor es requerido."),
  variants: z.array(productVariantFormSchema).min(1, "Agrega al menos una variante."),
});
