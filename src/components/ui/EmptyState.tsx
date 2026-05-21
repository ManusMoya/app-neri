import { Text, View, type ViewProps } from "react-native";

import { cn } from "@/utils/cn";
import { Button } from "./Button";

interface EmptyStateProps extends ViewProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onActionPress,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <View
      className={cn(
        "items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface px-5 py-8",
        className,
      )}
      {...props}
    >
      <Text className="text-center text-lg font-bold text-foreground">{title}</Text>
      {description ? (
        <Text className="text-center text-sm leading-5 text-muted-foreground">{description}</Text>
      ) : null}
      {actionLabel && onActionPress ? (
        <Button title={actionLabel} size="sm" variant="outline" onPress={onActionPress} />
      ) : null}
    </View>
  );
}

