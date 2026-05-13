import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
  Text,
} from "@/src/components/ui";
import { MarkdownEditor } from "@/src/components/MarkdownEditor";
import { MarkdownView } from "@/src/components/MarkdownView";
import {
  CopyButton,
  EmailButton,
  WhatsAppDoctorButton,
} from "@/src/components/informe-actions";
import type { Doctor } from "@/src/types";
import { colors, spacing } from "@/src/theme";

interface DoctorReportCardProps {
  doctor: Doctor | null;
  editing: boolean;
  saving: boolean;
  isReady: boolean;
  content: string;
  draft: string;
  consentBlock: string;
  onDraftChange: (next: string) => void;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function DoctorReportCard({
  doctor,
  editing,
  saving,
  isReady,
  content,
  draft,
  consentBlock,
  onDraftChange,
  onStartEdit,
  onCancel,
  onSave,
}: DoctorReportCardProps) {
  const { t } = useTranslation();
  const reportContent = content + consentBlock;
  const handleSave = useCallback(() => onSave(), [onSave]);

  return (
    <Card>
      <CardHeader>
        <View style={styles.row}>
          <CardTitle>{t("informes.doctorReport")}</CardTitle>
          {!editing ? (
            <Button
              title={t("common.edit")}
              variant="ghost"
              size="sm"
              leftIcon={
                <Icon name="create-outline" size={16} color={colors.foreground} />
              }
              onPress={onStartEdit}
            />
          ) : null}
        </View>
      </CardHeader>
      <CardContent>
        {editing ? (
          <>
            <MarkdownEditor value={draft} onChange={onDraftChange} disabled={saving} />
            <View style={styles.editActions}>
              <Button title={t("common.cancel")} variant="ghost" onPress={onCancel} />
              <Button title={t("common.save")} loading={saving} onPress={handleSave} />
            </View>
          </>
        ) : content.trim() ? (
          <MarkdownView content={content} />
        ) : (
          <Text variant="bodyMuted">{t("common.noContent")}</Text>
        )}
        {isReady && !editing ? (
          <View style={styles.actionsRow}>
            {doctor?.email ? (
              <EmailButton
                variant="doctor"
                email={doctor.email}
                doctorName={doctor.name}
                reportContent={reportContent}
              />
            ) : null}
            {doctor?.phone ? (
              <WhatsAppDoctorButton
                phone={doctor.phone}
                doctorName={doctor.name}
                reportContent={reportContent}
              />
            ) : null}
            <CopyButton text={reportContent} />
          </View>
        ) : null}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
});
