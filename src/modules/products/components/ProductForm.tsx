import { Controller } from "react-hook-form";
import { Text, View } from "react-native";

import { Button, Card, Input, SectionTitle } from "@/components/ui";

import type { useProductForm } from "../hooks";
import { useVariantForm } from "../hooks";

interface ProductFormProps {
  formState: ReturnType<typeof useProductForm>;
  submitLabel: string;
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return undefined;
}

export function ProductForm({ formState, submitLabel }: ProductFormProps) {
  const { form, isSubmitting, submit, submitError } = formState;
  const { fields, addVariant, remove } = useVariantForm(form.control);

  return (
    <View className="gap-6">
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
              placeholder="Ej. Remera basica"
              value={value}
            />
          )}
        />

        <Controller
          control={form.control}
          name="categoryName"
          render={({ field: { onBlur, onChange, value }, fieldState }) => (
            <Input
              autoCapitalize="words"
              error={fieldState.error?.message}
              label="Categoria"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Ej. Indumentaria"
              value={value}
            />
          )}
        />

        <Controller
          control={form.control}
          name="providerName"
          render={({ field: { onBlur, onChange, value }, fieldState }) => (
            <Input
              autoCapitalize="words"
              error={fieldState.error?.message}
              label="Proveedor"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Ej. Proveedor local"
              value={value}
            />
          )}
        />

        <Controller
          control={form.control}
          name="description"
          render={({ field: { onBlur, onChange, value }, fieldState }) => (
            <Input
              error={fieldState.error?.message}
              label="Descripcion"
              multiline
              numberOfLines={3}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Notas internas del producto"
              value={value}
            />
          )}
        />
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <SectionTitle title="Variantes" subtitle="Stock, precios y codigos por variante." />
          <Button title="Agregar" size="sm" variant="outline" onPress={addVariant} />
        </View>

        {fields.map((field, index) => (
          <Card key={field.id} className="gap-4">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-base font-bold text-foreground">Variante {index + 1}</Text>
              <Button
                title="Quitar"
                size="sm"
                variant="ghost"
                disabled={fields.length === 1}
                onPress={() => remove(index)}
              />
            </View>

            <View className="gap-3">
              <View className="flex-row gap-3">
                <Controller
                  control={form.control}
                  name={`variants.${index}.size`}
                  render={({ field: input }) => (
                    <Input
                      containerClassName="flex-1"
                      label="Talle"
                      onBlur={input.onBlur}
                      onChangeText={input.onChange}
                      value={input.value}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name={`variants.${index}.color`}
                  render={({ field: input }) => (
                    <Input
                      containerClassName="flex-1"
                      label="Color"
                      onBlur={input.onBlur}
                      onChangeText={input.onChange}
                      value={input.value}
                    />
                  )}
                />
              </View>

              <Controller
                control={form.control}
                name={`variants.${index}.model`}
                render={({ field: input }) => (
                  <Input
                    label="Modelo"
                    onBlur={input.onBlur}
                    onChangeText={input.onChange}
                    value={input.value}
                  />
                )}
              />

              <View className="flex-row gap-3">
                <Controller
                  control={form.control}
                  name={`variants.${index}.sku`}
                  render={({ field: input }) => (
                    <Input
                      autoCapitalize="characters"
                      containerClassName="flex-1"
                      label="SKU"
                      onBlur={input.onBlur}
                      onChangeText={input.onChange}
                      value={input.value}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name={`variants.${index}.barcode`}
                  render={({ field: input }) => (
                    <Input
                      containerClassName="flex-1"
                      inputMode="numeric"
                      label="Barcode"
                      onBlur={input.onBlur}
                      onChangeText={input.onChange}
                      value={input.value}
                    />
                  )}
                />
              </View>

              <View className="flex-row gap-3">
                <Controller
                  control={form.control}
                  name={`variants.${index}.stock`}
                  render={({ field: input, fieldState }) => (
                    <Input
                      containerClassName="flex-1"
                      error={fieldState.error?.message}
                      inputMode="numeric"
                      keyboardType="number-pad"
                      label="Stock"
                      onBlur={input.onBlur}
                      onChangeText={(value) => input.onChange(Number(value || 0))}
                      value={String(input.value)}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name={`variants.${index}.reservedStock`}
                  render={({ field: input, fieldState }) => (
                    <Input
                      containerClassName="flex-1"
                      error={fieldState.error?.message}
                      inputMode="numeric"
                      keyboardType="number-pad"
                      label="Reservado"
                      onBlur={input.onBlur}
                      onChangeText={(value) => input.onChange(Number(value || 0))}
                      value={String(input.value)}
                    />
                  )}
                />
              </View>

              <Controller
                control={form.control}
                name={`variants.${index}.minimumStock`}
                render={({ field: input, fieldState }) => (
                  <Input
                    error={fieldState.error?.message}
                    inputMode="numeric"
                    keyboardType="number-pad"
                    label="Stock minimo"
                    onBlur={input.onBlur}
                    onChangeText={(value) => input.onChange(Number(value || 0))}
                    value={String(input.value)}
                  />
                )}
              />

              <View className="flex-row gap-3">
                <Controller
                  control={form.control}
                  name={`variants.${index}.costPrice`}
                  render={({ field: input, fieldState }) => (
                    <Input
                      containerClassName="flex-1"
                      error={fieldState.error?.message}
                      inputMode="numeric"
                      keyboardType="number-pad"
                      label="Costo"
                      onBlur={input.onBlur}
                      onChangeText={(value) => input.onChange(Number(value || 0))}
                      value={String(input.value)}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name={`variants.${index}.salePrice`}
                  render={({ field: input, fieldState }) => (
                    <Input
                      containerClassName="flex-1"
                      error={fieldState.error?.message}
                      inputMode="numeric"
                      keyboardType="number-pad"
                      label="Precio"
                      onBlur={input.onBlur}
                      onChangeText={(value) => input.onChange(Number(value || 0))}
                      value={String(input.value)}
                    />
                  )}
                />
              </View>
            </View>
          </Card>
        ))}

        {getErrorMessage(form.formState.errors.variants) ? (
          <Text className="text-sm font-medium text-danger">
            {getErrorMessage(form.formState.errors.variants)}
          </Text>
        ) : null}
      </View>

      {submitError ? (
        <Text className="text-sm font-medium text-danger">{submitError}</Text>
      ) : null}

      <Button title={submitLabel} loading={isSubmitting} onPress={submit} />
    </View>
  );
}
