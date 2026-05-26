import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, type Href } from "expo-router";
import { useForm } from "react-hook-form";

import type { Client } from "@/database/schema";
import {
  createClientFromForm,
  updateClientFromForm,
} from "@/services/clients.api.service";

import type { ClientFormValues } from "../types";
import { clientFormSchema } from "../utils/validation";

interface UseClientFormOptions {
  client?: Client | null;
  mode: "create" | "edit";
}

export function useClientForm({ client, mode }: UseClientFormOptions) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultValues = useMemo<ClientFormValues>(
    () => ({
      name: client?.name ?? "",
      phone: client?.phone ?? "",
    }),
    [client],
  );

  const form = useForm<ClientFormValues>({
    defaultValues,
    resolver: zodResolver(clientFormSchema),
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const submit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      const savedClient =
        mode === "create"
          ? await createClientFromForm(values)
          : await updateClientFromForm(client?.id ?? "", values);

      router.replace(`/clients/${savedClient.id}` as Href);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo guardar el cliente.",
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
