import { useState } from "react";
import { useRouter, type Href } from "expo-router";

import { createOrder, CreateOrderInput, CreateOrderItemInput } from "@/services/orders.api.service";
import { Client } from "@/database/schema";

export function useOrderForm() {
  const router = useRouter();
  const [clientId, setClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<(CreateOrderItemInput & { variant: any })[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = (variant: any) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productVariantId === variant.id);
      if (existing) {
        return prev.map((item) =>
          item.productVariantId === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productVariantId: variant.id,
          quantity: 1,
          unitPrice: variant.salePrice,
          variant,
        },
      ];
    });
  };

  const removeItem = (variantId: string) => {
    setItems((prev) => prev.filter((item) => item.productVariantId !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.productVariantId === variantId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0);
  const total = Math.max(subtotal - discountAmount, 0);

  const handleSubmit = async () => {
    if (!clientId) {
      setError("Debe seleccionar un cliente.");
      return;
    }
    if (items.length === 0) {
      setError("El pedido debe tener al menos un producto.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const input: CreateOrderInput = {
        clientId,
        items: items.map(({ variant, ...rest }) => rest),
        discountAmount,
        depositAmount,
        notes: notes.trim() || undefined,
        status: "draft",
      };

      const order = await createOrder(input);
      router.replace(`/orders/${order.order.id}` as Href);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear el pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    clientId,
    setClientId: (id: string, client: Client) => {
      setClientId(id);
      setSelectedClient(client);
    },
    selectedClient,
    items,
    addItem,
    removeItem,
    updateQuantity,
    discountAmount,
    setDiscountAmount,
    depositAmount,
    setDepositAmount,
    notes,
    setNotes,
    subtotal,
    total,
    isSubmitting,
    error,
    handleSubmit,
  };
}
