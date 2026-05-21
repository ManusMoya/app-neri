import { Text, TextInput, View, type TextInputProps } from "react-native";

import { cn } from "@/utils/cn";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({ label, error, containerClassName, className, ...props }: InputProps) {
  return (
    <View className={cn("gap-2", containerClassName)}>
      {label ? <Text className="text-sm font-semibold text-foreground">{label}</Text> : null}
      <TextInput
        placeholderTextColor="#98A2B3"
        className={cn(
          "min-h-12 rounded-md border border-border bg-surface px-3 text-[15px] text-foreground",
          error && "border-danger",
          className,
        )}
        {...props}
      />
      {error ? <Text className="text-xs font-medium text-danger">{error}</Text> : null}
    </View>
  );
}

