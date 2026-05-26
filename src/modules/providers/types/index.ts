import type { z } from "zod";

import type { Provider } from "@/database/schema";

import { providerFormSchema } from "../utils/validation";

export type ProviderRecord = Provider;
export type ProviderFormValues = z.infer<typeof providerFormSchema>;
