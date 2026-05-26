import type { Provider, Purchase, PurchaseItem } from "@/database/schema";

export interface PurchaseItemWithProduct extends PurchaseItem {
  productName: string;
  variantLabel: string;
  sku: string | null;
}

export interface PurchaseWithDetails extends Purchase {
  provider: Provider;
  items: PurchaseItemWithProduct[];
}

export type PurchaseListRecord = Purchase & {
  provider: Provider;
};
