import { Pressable, StyleSheet } from "react-native";
import { Text } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";

interface PlanChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function PlanChip({ label, active, onPress }: PlanChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
    >
      <Text style={active ? styles.chipLabelActive : styles.chipLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: { color: colors.foreground, fontWeight: "500" },
  chipLabelActive: { color: colors.primaryForeground, fontWeight: "600" },
});
