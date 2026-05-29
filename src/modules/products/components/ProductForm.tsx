import { Controller } from "react-hook-form";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Button, Card, Input, SectionTitle } from "@/components/ui";
import type { Provider } from "@/database/schema";

import type { useProductForm } from "../hooks";
import { useVariantForm } from "../hooks";
import type { ProductFormValues } from "../types";

interface ProductFormProps {
  formState: ReturnType<typeof useProductForm>;
  providers: Provider[];
  submitLabel: string;
}

type VariantGroup = {
  color: string;
  costPrice: number;
  indices: number[];
  model: string;
  salePrice: number;
  sizes: string[];
};

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return undefined;
}

function parseSizesInput(value: string) {
  const normalized = value.trim().replace(/^talles?\s*/i, "").replace(/^talle\/s\s*/i, "");
  const rangeMatch = normalized.match(/^(\d+)\s*-\s*(\d+)$/);

  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);

    if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || end - start > 80) {
      throw new Error("La gama de talles no es valida.");
    }

    return Array.from({ length: end - start + 1 }, (_, index) => String(start + index));
  }

  const sizes = normalized
    .split(/[,\s]+/)
    .map((size) => size.trim())
    .filter(Boolean);

  return Array.from(new Set(sizes));
}

function formatSizes(sizes: string[]) {
  const normalized = sizes.filter(Boolean);

  if (normalized.length === 0) {
    return "";
  }

  const numericSizes = normalized.map(Number);
  const isNumericRange = numericSizes.every(Number.isInteger)
    && numericSizes.every((size, index) => index === 0 || size === numericSizes[index - 1] + 1);

  if (isNumericRange && normalized.length > 1) {
    return `${normalized[0]}-${normalized[normalized.length - 1]}`;
  }

  return normalized.join(", ");
}

function groupVariants(variants: ProductFormValues["variants"]) {
  const groups = new Map<string, VariantGroup>();

  variants.forEach((variant, index) => {
    const color = variant.color ?? "";
    const model = variant.model ?? "";
    const size = variant.size ?? "";
    const costPrice = variant.costPrice ?? 0;
    const salePrice = variant.salePrice ?? 0;
    const key = [
      color.trim(),
      model.trim(),
      costPrice,
      salePrice,
    ].join("\u001f");
    const group = groups.get(key) ?? {
      color,
      costPrice,
      indices: [],
      model,
      salePrice,
      sizes: [],
    };

    group.indices.push(index);
    if (size.trim()) {
      group.sizes.push(size);
    }
    groups.set(key, group);
  });

  return Array.from(groups.values());
}

export function ProductForm({ formState, providers, submitLabel }: ProductFormProps) {
  const { form, isSubmitting, submit, submitError } = formState;
  const { addVariant, addVariantRange, replace } = useVariantForm(form.control);
  const [rangeSize, setRangeSize] = useState("");
  const [rangeColor, setRangeColor] = useState("");
  const [rangeModel, setRangeModel] = useState("");
  const [rangeCost, setRangeCost] = useState(0);
  const [rangeSale, setRangeSale] = useState(0);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [groupErrors, setGroupErrors] = useState<Record<string, string>>({});
  const [sizeDrafts, setSizeDrafts] = useState<Record<string, string>>({});
  const variants = form.watch("variants");
  const variantGroups = useMemo(() => groupVariants(variants), [variants]);

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

  const updateGroup = (
    indices: number[],
    patch: Partial<ProductFormValues["variants"][number]>,
  ) => {
    const nextVariants = form.getValues("variants").map((variant, index) =>
      indices.includes(index) ? { ...variant, ...patch } : variant,
    );
    form.setValue("variants", nextVariants, { shouldDirty: true, shouldValidate: true });
  };

  const updateGroupSizes = (groupKey: string, indices: number[], value: string) => {
    setGroupErrors((current) => ({ ...current, [groupKey]: "" }));

    try {
      const sizes = parseSizesInput(value);
      const currentVariants = form.getValues("variants");
      const base = currentVariants[indices[0]];
      const remaining = currentVariants.filter((_, index) => !indices.includes(index));
      const replacement = sizes.length > 0
        ? sizes.map((size) => ({ ...base, size }))
        : [{ ...base, size: "" }];

      replace([...remaining, ...replacement]);
      setSizeDrafts((current) => {
        const next = { ...current };
        delete next[groupKey];
        return next;
      });
    } catch (error) {
      setGroupErrors((current) => ({
        ...current,
        [groupKey]: error instanceof Error ? error.message : "No se pudo actualizar el rango.",
      }));
    }
  };

  const removeGroup = (indices: number[]) => {
    const remaining = form.getValues("variants").filter((_, index) => !indices.includes(index));
    replace(remaining.length > 0 ? remaining : [{
      color: "",
      costPrice: 0,
      model: "",
      salePrice: 0,
      size: "",
    }]);
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

        {variantGroups.map((group, index) => {
          const groupKey = `variant-group-${group.indices.join("-")}`;
          const sizeValue = sizeDrafts[groupKey] ?? formatSizes(group.sizes);

          return (
          <Card key={groupKey} className="gap-4">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-base font-bold text-foreground">
                Grupo {index + 1}
              </Text>
              <Button
                title="Quitar"
                size="sm"
                variant="ghost"
                disabled={variantGroups.length === 1}
                onPress={() => removeGroup(group.indices)}
              />
            </View>

            <View className="gap-3">
              <Input
                label="Talles"
                placeholder="Ej. 38-42 o 38, 39, 40"
                value={sizeValue}
                onBlur={() => updateGroupSizes(groupKey, group.indices, sizeValue)}
                onChangeText={(value) =>
                  setSizeDrafts((current) => ({ ...current, [groupKey]: value }))
                }
                error={groupErrors[groupKey] || undefined}
              />
              <View className="flex-row gap-3">
                <Input
                  containerClassName="flex-1"
                  label="Color"
                  onChangeText={(value) => updateGroup(group.indices, { color: value })}
                  value={group.color}
                />
                <Input
                  containerClassName="flex-1"
                  label="Modelo"
                  onChangeText={(value) => updateGroup(group.indices, { model: value })}
                  value={group.model}
                />
              </View>

              <View className="flex-row gap-3">
                <Input
                  containerClassName="flex-1"
                  inputMode="numeric"
                  keyboardType="number-pad"
                  label="Costo"
                  onChangeText={(value) => updateGroup(group.indices, { costPrice: Number(value || 0) })}
                  value={String(group.costPrice)}
                />
                <Input
                  containerClassName="flex-1"
                  inputMode="numeric"
                  keyboardType="number-pad"
                  label="Precio"
                  onChangeText={(value) => updateGroup(group.indices, { salePrice: Number(value || 0) })}
                  value={String(group.salePrice)}
                />
              </View>
            </View>
          </Card>
          );
        })}

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
