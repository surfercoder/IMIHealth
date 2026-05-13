import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Badge, Icon, Text } from "@/src/components/ui";
import { formatDateTime } from "@/src/utils/format";
import type { Informe, InformeStatus } from "@/src/types";
import { colors, radius, spacing } from "@/src/theme";

interface InformeRowProps {
  informe: Informe;
  onPress?: () => void;
}

const statusTone: Record<InformeStatus, "success" | "warning" | "destructive" | "info"> =
  {
    completed: "success",
    processing: "info",
    recording: "warning",
    error: "destructive",
  };

export function InformeRow({ informe, onPress }: InformeRowProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language ?? "es";
  const statusLabel = t(`status.${informe.status}` as never, {
    defaultValue: informe.status,
  }) as string;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View style={styles.iconChip}>
        <Icon name="document-text" size={18} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <Text variant="body" weight="semibold">
          {formatDateTime(informe.created_at, lang)}
        </Text>
        <Badge label={statusLabel} tone={statusTone[informe.status]} />
      </View>
      <Icon name="chevron-forward" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
  },
  pressed: { backgroundColor: colors.secondary },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
  },
  body: { flex: 1, gap: spacing.xs },
});
