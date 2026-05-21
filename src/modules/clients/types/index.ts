import type { z } from "zod";

import type { Client } from "@/database/schema";

import { clientFormSchema } from "../utils/validation";

export type ClientRecord = Client;
export type ClientFormValues = z.infer<typeof clientFormSchema>;
