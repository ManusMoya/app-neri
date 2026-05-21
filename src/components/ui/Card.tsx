import { View, type ViewProps } from "react-native";

import { cn } from "@/utils/cn";

interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ className, ...props }: CardProps) {
  return (
    <View
      className={cn("rounded-lg border border-border bg-surface p-4 shadow-card", className)}
      {...props}
    />
  );
}

