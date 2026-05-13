import type { Ref } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
} from "react-native";
import { colors, fontSize, fontWeight, radius, spacing } from "@/src/theme";
import { Text } from "./Text";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  ref?: Ref<View>;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth,
  disabled,
  ref,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = variantStyles[variant];

  return (
    <Pressable
      ref={ref}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      android_ripple={{ color: "rgba(0,0,0,0.08)" }}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size].container,
        variantStyle.container,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && variantStyle.pressed,
        isDisabled && styles.disabled,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.indicator} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
          <Text
            style={[
              styles.label,
              sizeStyles[size].label,
              { color: variantStyle.text },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  fullWidth: { alignSelf: "stretch" },
  disabled: { opacity: 0.5 },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  icon: { alignItems: "center", justifyContent: "center" },
  label: {
    fontWeight: fontWeight.semibold,
  },
});

const sizeStyles = {
  sm: StyleSheet.create({
    container: {
      paddingHorizontal: spacing.md,
      minHeight: 36,
    },
    label: { fontSize: fontSize.sm },
  }),
  md: StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg,
      minHeight: 44,
    },
    label: { fontSize: fontSize.base },
  }),
  lg: StyleSheet.create({
    container: {
      paddingHorizontal: spacing.xl,
      minHeight: 52,
    },
    label: { fontSize: fontSize.md },
  }),
};

type VariantTokens = {
  container: object;
  pressed: object;
  text: string;
  indicator: string;
};

const variantStyles: Record<ButtonVariant, VariantTokens> = {
  primary: {
    container: { backgroundColor: colors.primary },
    pressed: { backgroundColor: "#1e293b" },
    text: colors.primaryForeground,
    indicator: colors.primaryForeground,
  },
  secondary: {
    container: { backgroundColor: colors.secondary },
    pressed: { backgroundColor: "#e2e8f0" },
    text: colors.secondaryForeground,
    indicator: colors.secondaryForeground,
  },
  outline: {
    container: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { backgroundColor: colors.secondary },
    text: colors.foreground,
    indicator: colors.foreground,
  },
  ghost: {
    container: { backgroundColor: "transparent" },
    pressed: { backgroundColor: colors.secondary },
    text: colors.foreground,
    indicator: colors.foreground,
  },
  destructive: {
    container: { backgroundColor: colors.destructive },
    pressed: { backgroundColor: "#dc2626" },
    text: colors.destructiveForeground,
    indicator: colors.destructiveForeground,
  },
};
