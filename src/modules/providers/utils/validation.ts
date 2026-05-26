import { z } from "zod";

import { getPhoneDigits } from "@/modules/clients/utils";

export const providerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es requerido.")
    .max(80, "El nombre no puede superar 80 caracteres."),
  phone: z
    .string()
    .trim()
    .max(32, "El telefono no puede superar 32 caracteres.")
    .optional()
    .refine((value) => !value || getPhoneDigits(value).length >= 8, {
      message: "El telefono debe tener al menos 8 digitos.",
    }),
  email: z
    .string()
    .trim()
    .max(120, "El email no puede superar 120 caracteres.")
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: "Ingresa un email valido.",
    }),
  address: z
    .string()
    .trim()
    .max(160, "La direccion no puede superar 160 caracteres.")
    .optional(),
  notes: z
    .string()
    .trim()
    .max(500, "Las notas no pueden superar 500 caracteres.")
    .optional(),
});
