import { ActivityIndicator, View, type ViewProps } from "react-native";

import { cn } from "@/utils/cn";

interface LoadingSpinnerProps extends ViewProps {
  size?: "small" | "large";
}

export function LoadingSpinner({ size = "large", className, ...props }: LoadingSpinnerProps) {
  return (
    <View className={cn("items-center justify-center p-4", className)} {...props}>
      <ActivityIndicator size={size} color="#0F766E" />
    </View>
  );
}

