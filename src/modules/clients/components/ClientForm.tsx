import { Controller } from "react-hook-form";
import { Text, View } from "react-native";

import { Button, Input } from "@/components/ui";

import type { useClientForm } from "../hooks";
import { formatPhoneInput } from "../utils";

interface ClientFormProps {
  formState: ReturnType<typeof useClientForm>;
  submitLabel: string;
}

export function ClientForm({ formState, submitLabel }: ClientFormProps) {
  const { form, isSubmitting, submit, submitError } = formState;

  return (
    <View className="gap-5">
      <View className="gap-4">
        <Controller
          control={form.control}
          name="name"
          render={({ field: { onBlur, onChange, value }, fieldState }) => (
            <Input
              autoCapitalize="words"
              autoCorrect={false}
              error={fieldState.error?.message}
              label="Nombre"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Ej. Maria Gonzalez"
              returnKeyType="next"
              value={value}
            />
          )}
        />

        <Controller
          control={form.control}
          name="phone"
          render={({ field: { onBlur, onChange, value }, fieldState }) => (
            <Input
              error={fieldState.error?.message}
              inputMode="tel"
              keyboardType="phone-pad"
              label="Telefono"
              onBlur={onBlur}
              onChangeText={(nextValue) => onChange(formatPhoneInput(nextValue))}
              placeholder="Ej. +54 9 11 1234-5678"
              value={value}
            />
          )}
        />
      </View>

      {submitError ? (
        <Text className="text-sm font-medium text-danger">{submitError}</Text>
      ) : null}

      <Button title={submitLabel} loading={isSubmitting} onPress={submit} />
    </View>
  );
}
