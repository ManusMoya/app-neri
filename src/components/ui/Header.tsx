import { Text, View, type ViewProps } from "react-native";

import { cn } from "@/utils/cn";

interface HeaderProps extends ViewProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

export function Header({ title, subtitle, rightSlot, className, ...props }: HeaderProps) {
  return (
    <View className={cn("mb-4 flex-row items-start justify-between gap-3", className)} {...props}>
      <View className="min-w-0 flex-1 gap-1">
        <Text className="text-2xl font-bold text-foreground">{title}</Text>
        {subtitle ? (
          <Text className="text-sm leading-5 text-muted-foreground">{subtitle}</Text>
        ) : null}
      </View>
      {rightSlot ? <View className="shrink-0">{rightSlot}</View> : null}
    </View>
  );
}

