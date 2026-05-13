import { StyleSheet, View } from "react-native";
import { Icon, type IconName, Text } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: IconName;
  tone?: "primary" | "success" | "warning" | "destructive" | "info";
}

const tonePalette = {
  primary: { bg: colors.secondary, fg: colors.primary },
  success: { bg: "#dcfce7", fg: "#166534" },
  warning: { bg: "#fef3c7", fg: "#92400e" },
  destructive: { bg: "#fee2e2", fg: "#991b1b" },
  info: { bg: "#e0f2fe", fg: "#075985" },
} as const;

export function StatCard({ label, value, icon, tone = "primary" }: StatCardProps) {
  const palette = tonePalette[tone];
  return (
    <View style={styles.card}>
      <View style={[styles.iconChip, { backgroundColor: palette.bg }]}>
        <Icon name={icon} size={18} color={palette.fg} />
      </View>
      <Text variant="caption">{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    gap: spacing.xs,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground,
  },
});
