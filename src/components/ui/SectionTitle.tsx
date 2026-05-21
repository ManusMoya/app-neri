import { Text, View, type ViewProps } from "react-native";

import { cn } from "@/utils/cn";

interface SectionTitleProps extends ViewProps {
  title: string;
  subtitle?: string;
}

export function SectionTitle({ title, subtitle, className, ...props }: SectionTitleProps) {
  return (
    <View className={cn("gap-1", className)} {...props}>
      <Text className="text-lg font-bold text-foreground">{title}</Text>
      {subtitle ? (
        <Text className="text-sm leading-5 text-muted-foreground">{subtitle}</Text>
      ) : null}
    </View>
  );
}

