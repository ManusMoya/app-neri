import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, type Href } from "expo-router";
import { useForm } from "react-hook-form";

import type { Provider } from "@/database/schema";
import {
  createProviderFromForm,
  updateProviderFromForm,
} from "@/services/providers.api.service";

import type { ProviderFormValues } from "../types";
import { providerFormSchema } from "../utils";

interface UseProviderFormOptions {
  mode: "create" | "edit";
  provider?: Provider | null;
}

export function useProviderForm({ mode, provider }: UseProviderFormOptions) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultValues = useMemo<ProviderFormValues>(
    () => ({
      name: provider?.name ?? "",
      phone: provider?.phone ?? "",
      email: provider?.email ?? "",
      address: provider?.address ?? "",
      notes: provider?.notes ?? "",
    }),
    [provider],
  );

  const form = useForm<ProviderFormValues>({
    defaultValues,
    resolver: zodResolver(providerFormSchema),
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const submit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      const savedProvider =
        mode === "create"
          ? await createProviderFromForm(values)
          : await updateProviderFromForm(provider?.id ?? "", values);

      router.replace(`/providers/${savedProvider.id}` as Href);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo guardar el proveedor.",
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
