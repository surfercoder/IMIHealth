import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from "react-native";
import { colors, fontSize, fontWeight } from "@/src/theme";

type Variant =
  | "display"
  | "title"
  | "subtitle"
  | "body"
  | "bodyMuted"
  | "small"
  | "label"
  | "caption";

interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: string;
  weight?: keyof typeof fontWeight;
  center?: boolean;
}

export function Text({
  variant = "body",
  color,
  weight,
  center,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      {...rest}
      style={[
        styles[variant],
        center && styles.center,
        color !== undefined && { color },
        weight !== undefined && { fontWeight: fontWeight[weight] },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  display: {
    fontSize: fontSize["4xl"],
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    color: colors.mutedForeground,
  },
  body: {
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  bodyMuted: {
    fontSize: fontSize.base,
    color: colors.mutedForeground,
  },
  small: {
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },
  caption: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  center: {
    textAlign: "center",
  },
});
