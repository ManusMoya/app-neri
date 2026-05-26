import { Controller } from "react-hook-form";
import { Text, View } from "react-native";

import { Button, Input } from "@/components/ui";
import { formatPhoneInput } from "@/modules/clients/utils";

import type { useProviderForm } from "../hooks";

interface ProviderFormProps {
  formState: ReturnType<typeof useProviderForm>;
  submitLabel: string;
}

export function ProviderForm({ formState, submitLabel }: ProviderFormProps) {
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
              placeholder="Ej. Distribuidora Norte"
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

        <Controller
          control={form.control}
          name="email"
          render={({ field: { onBlur, onChange, value }, fieldState }) => (
            <Input
              autoCapitalize="none"
              autoCorrect={false}
              error={fieldState.error?.message}
              inputMode="email"
              keyboardType="email-address"
              label="Email"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="ventas@proveedor.com"
              value={value}
            />
          )}
        />

        <Controller
          control={form.control}
          name="address"
          render={({ field: { onBlur, onChange, value }, fieldState }) => (
            <Input
              autoCapitalize="sentences"
              error={fieldState.error?.message}
              label="Direccion"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Calle, numero, localidad"
              value={value}
            />
          )}
        />

        <Controller
          control={form.control}
          name="notes"
          render={({ field: { onBlur, onChange, value }, fieldState }) => (
            <Input
              autoCapitalize="sentences"
              error={fieldState.error?.message}
              label="Notas"
              multiline
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Condiciones, horarios o datos utiles"
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
