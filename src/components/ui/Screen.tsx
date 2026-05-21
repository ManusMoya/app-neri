import { ScrollView, View, type ScrollViewProps, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { cn } from "@/utils/cn";

interface ScreenProps extends ScrollViewProps {
  scroll?: boolean;
  contentClassName?: string;
}

export function Screen({
  scroll = true,
  className,
  contentClassName,
  children,
  ...props
}: ScreenProps) {
  if (!scroll) {
    return (
      <SafeAreaView className={cn("flex-1 bg-background", className)} edges={["top"]}>
        <View className={cn("flex-1 px-4 py-4", contentClassName)}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={cn("flex-1 bg-background", className)} edges={["top"]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerClassName={cn("px-4 py-4 pb-8", contentClassName)}
        {...props}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function ScreenBody({ className, ...props }: ViewProps) {
  return <View className={cn("gap-4", className)} {...props} />;
}

