import { Controller } from "react-hook-form";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Button, Card, Input, SectionTitle } from "@/components/ui";
import type { Provider } from "@/database/schema";

import type { useProductForm } from "../hooks";
import { useVariantForm } from "../hooks";

interface ProductFormProps {
  formState: ReturnType<typeof useProductForm>;
  providers: Provider[];
  submitLabel: string;
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return undefined;
}

export function ProductForm({ formState, providers, submitLabel }: ProductFormProps) {
  const { form, isSubmitting, submit, submitError } = formState;
  const { fields, addVariant, addVariantRange, remove } = useVariantForm(form.control);
  const [rangeSize, setRangeSize] = useState("");
  const [rangeColor, setRangeColor] = useState("");
  const [rangeModel, setRangeModel] = useState("");
  const [rangeCost, setRangeCost] = useState(0);
  const [rangeSale, setRangeSale] = useState(0);
  const [rangeError, setRangeError] = useState<string | null>(null);

  const handleAddRange = () => {
    setRangeError(null);

    try {
      addVariantRange({
        color: rangeColor,
        costPrice: rangeCost,
        model: rangeModel,
        salePrice: rangeSale,
        sizeRange: rangeSize,
      });
      setRangeSize("");
    } catch (error) {
      setRangeError(error instanceof Error ? error.message : "No se pudieron generar los talles.");
    }
  };

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
          name="providerId"
          render={({ field: { onChange, value }, fieldState }) => (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Proveedor</Text>
              <View className="gap-2">
                {providers.map((provider) => (
                  <Pressable
                    key={provider.id}
                    accessibilityRole="button"
                    className={`rounded-md border px-3 py-3 ${
                      value === provider.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-surface"
                    }`}
                    onPress={() => onChange(provider.id)}
                  >
                    <Text className="text-sm font-semibold text-foreground">
                      {provider.name}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {provider.phone || provider.email || "Sin contacto cargado"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {fieldState.error?.message ? (
                <Text className="text-xs font-medium text-danger">
                  {fieldState.error.message}
                </Text>
              ) : null}
            </View>
          )}
        />
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <SectionTitle title="Variantes" subtitle="Stock y precios por variante." />
          <Button title="Agregar" size="sm" variant="outline" onPress={addVariant} />
        </View>

        <Card className="gap-3">
          <Text className="text-base font-bold text-foreground">Generar por talles</Text>
          <Input
            label="Talles"
            placeholder="Ej. 38-42 o 38, 39, 40"
            value={rangeSize}
            onChangeText={setRangeSize}
          />
          <View className="flex-row gap-3">
            <Input
              containerClassName="flex-1"
              label="Color"
              value={rangeColor}
              onChangeText={setRangeColor}
            />
            <Input
              containerClassName="flex-1"
              label="Modelo"
              value={rangeModel}
              onChangeText={setRangeModel}
            />
          </View>
          <View className="flex-row gap-3">
            <Input
              containerClassName="flex-1"
              inputMode="numeric"
              keyboardType="number-pad"
              label="Costo"
              value={String(rangeCost)}
              onChangeText={(value) => setRangeCost(Number(value || 0))}
            />
            <Input
              containerClassName="flex-1"
              inputMode="numeric"
              keyboardType="number-pad"
              label="Precio"
              value={String(rangeSale)}
              onChangeText={(value) => setRangeSale(Number(value || 0))}
            />
          </View>
          {rangeError ? (
            <Text className="text-sm font-medium text-danger">{rangeError}</Text>
          ) : null}
          <Button title="Generar talles" variant="secondary" onPress={handleAddRange} />
        </Card>

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
