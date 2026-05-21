import { Text, type TextProps } from "react-native";

import { cn } from "@/utils/cn";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

interface BadgeProps extends TextProps {
  label: string;
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-green-50 text-success",
  warning: "bg-amber-50 text-warning",
  danger: "bg-red-50 text-danger",
  info: "bg-blue-50 text-info",
};

export function Badge({ label, tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <Text
      className={cn(
        "self-start rounded-sm px-2 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {label}
    </Text>
  );
}

