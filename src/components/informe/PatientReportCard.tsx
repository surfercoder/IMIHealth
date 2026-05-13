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
  CertificadoButton,
  CopyButton,
  EmailButton,
  PedidosButton,
  ViewPdfButton,
  WhatsAppPatientButton,
} from "@/src/components/informe-actions";
import type { Doctor, Patient } from "@/src/types";
import { colors, spacing } from "@/src/theme";

interface PatientReportCardProps {
  informeId: string;
  doctor: Doctor | null;
  patient: Patient | null;
  editing: boolean;
  saving: boolean;
  isReady: boolean;
  content: string;
  doctorContent: string;
  draft: string;
  onDraftChange: (next: string) => void;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function PatientReportCard({
  informeId,
  doctor,
  patient,
  editing,
  saving,
  isReady,
  content,
  doctorContent,
  draft,
  onDraftChange,
  onStartEdit,
  onCancel,
  onSave,
}: PatientReportCardProps) {
  const { t } = useTranslation();
  const handleSave = useCallback(() => onSave(), [onSave]);

  return (
    <Card>
      <CardHeader>
        <View style={styles.row}>
          <CardTitle>{t("patientPage.consult")}</CardTitle>
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
            <ViewPdfButton informeId={informeId} />
            {patient?.email && doctor?.name ? (
              <EmailButton
                variant="patient"
                email={patient.email}
                doctorName={doctor.name}
                patientName={patient.name}
                reportContent={content}
              />
            ) : null}
            {patient?.phone ? (
              <WhatsAppPatientButton
                phone={patient.phone}
                patientName={patient.name}
                informeId={informeId}
              />
            ) : null}
            {patient ? (
              <CertificadoButton
                informeId={informeId}
                patientName={patient.name}
                patientPhone={patient.phone}
                informeDoctor={doctorContent}
              />
            ) : null}
            {patient ? (
              <PedidosButton
                informeId={informeId}
                patientName={patient.name}
                patientPhone={patient.phone}
                informeDoctor={doctorContent}
              />
            ) : null}
            <CopyButton text={content} tone="emerald" />
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
