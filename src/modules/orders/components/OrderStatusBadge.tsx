import React from "react";
import { Badge } from "@/components/ui/Badge";
import type { Order } from "@/database/schema";

interface OrderStatusBadgeProps {
  status: Order["status"];
}

const statusConfig: Record<Order["status"], { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" }> = {
  draft: { label: "Pendiente", tone: "neutral" },
  reserved: { label: "Reservado", tone: "warning" },
  confirmed: { label: "Confirmado", tone: "info" },
  delivered: { label: "Entregado", tone: "success" },
  cancelled: { label: "Cancelado", tone: "danger" },
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, tone: "neutral" };
  
  return <Badge label={config.label} tone={config.tone} />;
}
