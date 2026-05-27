import { useState } from "react";
import { useRouter, type Href } from "expo-router";

import { createReceivedPurchase, CreateReceivedPurchaseInput, CreatePurchaseItemInput } from "@/services/purchases.api.service";
import { Provider } from "@/database/schema";

export function usePurchaseForm() {
  const router = useRouter();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [items, setItems] = useState<(CreatePurchaseItemInput & { variant: any })[]>([]);
  const [shippingAmount, setShippingAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = (variant: any) => {
    addItemWithQuantity(variant, 1);
  };

  const addItemWithQuantity = (variant: any, quantity: number) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productVariantId === variant.id);
      if (existing) {
        return prev.map((item) =>
          item.productVariantId === variant.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          productVariantId: variant.id,
          quantity,
          baseCost: variant.costPrice,
          variant,
        },
      ];
    });
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.productVariantId !== variantId));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.productVariantId === variantId ? { ...item, quantity } : item
      )
    );
  };

  const updateCost = (variantId: string, baseCost: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productVariantId === variantId ? { ...item, baseCost } : item
      )
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.baseCost * item.quantity, 0);
  const total = subtotal + shippingAmount;

  const handleSubmit = async () => {
    if (!providerId) {
      setError("Debe seleccionar un proveedor.");
      return;
    }
    if (items.length === 0) {
      setError("La compra debe tener al menos un producto.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const input: CreateReceivedPurchaseInput = {
        providerId,
        items: items.map(({ variant, ...rest }) => rest),
        shippingAmount,
        paidAmount: total,
        notes: notes.trim() || undefined,
      };

      const purchase = await createReceivedPurchase(input);
      router.replace(`/purchases/${purchase.purchase.id}` as Href);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al registrar la compra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    setProvider: (id: string, provider: Provider) => {
      setProviderId(id);
      setSelectedProvider(provider);
    },
    selectedProvider,
    items,
    addItem,
    addItemWithQuantity,
    updateQuantity,
    updateCost,
    shippingAmount,
    setShippingAmount,
    notes,
    setNotes,
    subtotal,
    total,
    isSubmitting,
    error,
    handleSubmit,
  };
}
