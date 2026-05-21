import { Text, type TextProps } from "react-native";

import { cn } from "@/utils/cn";

interface CurrencyTextProps extends TextProps {
  amount: number;
  currency?: string;
  locale?: string;
}

function formatCurrency(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(locale)}`;
  }
}

export function CurrencyText({
  amount,
  currency = "ARS",
  locale = "es-AR",
  className,
  ...props
}: CurrencyTextProps) {
  return (
    <Text className={cn("font-semibold text-foreground", className)} {...props}>
      {formatCurrency(amount, currency, locale)}
    </Text>
  );
}

