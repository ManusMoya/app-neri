import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Order } from "@/database/schema";

interface OrderPaymentStatusBadgeProps {
  status: Order["paymentStatus"];
}

const statusConfig: Record<Order["paymentStatus"], { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" }> = {
  unpaid: { label: "Impago", tone: "danger" },
  partial: { label: "Parcial", tone: "warning" },
  paid: { label: "Pagado", tone: "success" },
  refunded: { label: "Reembolsado", tone: "info" },
};

export function OrderPaymentStatusBadge({ status }: OrderPaymentStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, tone: "neutral" };
  
  return <Badge label={config.label} tone={config.tone} />;
}
