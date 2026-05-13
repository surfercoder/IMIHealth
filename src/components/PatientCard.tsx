import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Avatar, Badge, Icon, Text } from "@/src/components/ui";
import type { PatientWithStats } from "@/src/types";
import { getDoctorInitials } from "@/src/utils/avatar";
import { formatDate } from "@/src/utils/format";
import { colors, radius, spacing } from "@/src/theme";

interface PatientCardProps {
  patient: PatientWithStats;
  onPress?: () => void;
}

export function PatientCard({ patient, onPress }: PatientCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language ?? "es";

  const reportsLabel =
    patient.informe_count === 1 ? t("patientsList.report") : t("patientsList.reports");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Avatar initials={getDoctorInitials(patient.name)} size={42} />
      <View style={styles.body}>
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {patient.name}
        </Text>
        <Text variant="caption" numberOfLines={1}>
          {[patient.dni, patient.phone].filter(Boolean).join(" • ") || "—"}
        </Text>
        <View style={styles.meta}>
          <Badge
            label={`${patient.informe_count} ${reportsLabel}`}
            tone="neutral"
          />
          {patient.last_informe_at ? (
            <Text variant="caption">
              {t("patientsList.lastConsult")} {formatDate(patient.last_informe_at, lang)}
            </Text>
          ) : null}
        </View>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
  },
  pressed: { opacity: 0.85, backgroundColor: colors.secondary },
  body: { flex: 1, gap: spacing.xs },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 2,
  },
});
