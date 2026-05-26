import React from "react";
import { Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { CurrencyText } from "@/components/ui/CurrencyText";

interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  type?: "currency" | "number";
  trend?: "positive" | "negative" | "neutral";
}

export function MetricCard({ title, value, subtitle, type = "currency", trend = "neutral" }: MetricCardProps) {
  return (
    <Card className="p-4 flex-1">
      <Text className="text-sm text-slate-500 font-bold uppercase mb-2">{title}</Text>
      {type === "currency" ? (
        <CurrencyText amount={value} className="text-xl font-bold text-slate-900" />
      ) : (
        <Text className="text-xl font-bold text-slate-900">{value}</Text>
      )}
      {subtitle && (
        <Text className="text-xs text-slate-400 mt-1">{subtitle}</Text>
      )}
    </Card>
  );
}
