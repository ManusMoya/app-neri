import { z } from "zod";

import { getPhoneDigits } from "./phone";

export const clientFormSchema = z.object({
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
});
