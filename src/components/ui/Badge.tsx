import { StyleSheet, View } from "react-native";
import { colors, fontSize, fontWeight, radius, spacing } from "@/src/theme";
import { Text } from "./Text";

type Tone = "neutral" | "success" | "warning" | "destructive" | "info" | "primary";

export function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const palette = palettes[tone];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const palettes: Record<Tone, { bg: string; fg: string; border: string }> = {
  neutral: { bg: colors.secondary, fg: colors.secondaryForeground, border: colors.border },
  success: { bg: "#dcfce7", fg: "#166534", border: "#bbf7d0" },
  warning: { bg: "#fef3c7", fg: "#92400e", border: "#fde68a" },
  destructive: { bg: "#fee2e2", fg: "#991b1b", border: "#fecaca" },
  info: { bg: "#e0f2fe", fg: "#075985", border: "#bae6fd" },
  primary: { bg: "#e2e8f0", fg: colors.primary, border: "#cbd5e1" },
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
