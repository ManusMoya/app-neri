import type { ProductVariant } from "@/database/schema";

export type StockStatus = "normal" | "low" | "out";

export function getAvailableStock(variant: Pick<ProductVariant, "stock" | "reservedStock">) {
  return Math.max(variant.stock - variant.reservedStock, 0);
}

export function getVariantMargin(
  variant: Pick<ProductVariant, "costPrice" | "salePrice">,
) {
  const grossMargin = variant.salePrice - variant.costPrice;
  const profitPercent =
    variant.salePrice > 0 ? Math.round((grossMargin / variant.salePrice) * 100) : 0;

  return { grossMargin, profitPercent };
}

export function getStockStatus(
  variant: Pick<ProductVariant, "stock" | "reservedStock" | "minimumStock">,
): StockStatus {
  const availableStock = getAvailableStock(variant);

  if (availableStock <= 0) {
    return "out";
  }

  if (availableStock <= variant.minimumStock) {
    return "low";
  }

  return "normal";
}

export function getStockStatusLabel(status: StockStatus) {
  if (status === "out") {
    return "Sin stock";
  }

  if (status === "low") {
    return "Stock bajo";
  }

  return "Stock normal";
}

export function getStockStatusTone(status: StockStatus) {
  if (status === "out") {
    return "danger" as const;
  }

  if (status === "low") {
    return "warning" as const;
  }

  return "success" as const;
}

export function buildVariantLabel(
  variant: Pick<ProductVariant, "color" | "size" | "model" | "sku">,
) {
  return [variant.color, variant.size, variant.model].filter(Boolean).join(" / ")
    || variant.sku
    || "Variante base";
}

export function getProductMetrics(variants: ProductVariant[]) {
  const activeVariants = variants.filter((variant) => variant.isActive);
  const stockTotal = activeVariants.reduce((sum, variant) => sum + variant.stock, 0);
  const reservedStock = activeVariants.reduce((sum, variant) => sum + variant.reservedStock, 0);
  const availableStock = activeVariants.reduce(
    (sum, variant) => sum + getAvailableStock(variant),
    0,
  );
  const inventoryValue = activeVariants.reduce(
    (sum, variant) => sum + variant.stock * variant.costPrice,
    0,
  );
  const averageMargin =
    activeVariants.length === 0
      ? 0
      : Math.round(
          activeVariants.reduce(
            (sum, variant) => sum + getVariantMargin(variant).profitPercent,
            0,
          ) / activeVariants.length,
        );

  return {
    averageMargin,
    availableStock,
    inventoryValue,
    reservedStock,
    stockTotal,
  };
}
