import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  outline: "border border-border bg-surface",
  ghost: "bg-transparent",
  danger: "bg-danger",
};

const textVariantClasses: Record<ButtonVariant, string> = {
  primary: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  outline: "text-foreground",
  ghost: "text-foreground",
  danger: "text-white",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 px-3",
  md: "h-12 px-4",
  lg: "h-14 px-5",
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  textClassName,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        "items-center justify-center rounded-md",
        sizeClasses[size],
        variantClasses[variant],
        isDisabled && "opacity-50",
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" || variant === "ghost" ? "#111827" : "#FFFFFF"} />
      ) : (
        <Text
          className={cn(
            "text-center text-[15px] font-semibold",
            textVariantClasses[variant],
            textClassName,
          )}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

