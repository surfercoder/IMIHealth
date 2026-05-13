import { useMemo, useReducer } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Button, Card, CardContent, FormField, Icon, Input, Text } from "@/src/components/ui";
import { sharePdf } from "@/src/lib/api/pdf";
import { sendCertificadoWhatsApp, type CertOptions } from "@/src/lib/api/whatsapp";
import { extractDiagnosticoPresuntivo } from "@/src/lib/informe-extract";
import { colors, spacing } from "@/src/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  informeId: string;
  patientName: string;
  patientPhone: string | null;
  informeDoctor: string | null;
}

interface State {
  daysOff: string;
  diagnosis: string;
  observations: string;
  busy: boolean;
  waSending: boolean;
  generated: boolean;
}

type Action =
  | { type: "reset"; defaultDiagnosis: string }
  | { type: "setDaysOff"; value: string }
  | { type: "setDiagnosis"; value: string }
  | { type: "setObservations"; value: string }
  | { type: "startGenerate" }
  | { type: "stopGenerate" }
  | { type: "markGenerated" }
  | { type: "startWhatsApp" }
  | { type: "stopWhatsApp" };

function initialState(defaultDiagnosis: string): State {
  return {
    daysOff: "",
    diagnosis: defaultDiagnosis,
    observations: "",
    busy: false,
    waSending: false,
    generated: false,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset":
      return initialState(action.defaultDiagnosis);
    case "setDaysOff":
      return { ...state, daysOff: action.value };
    case "setDiagnosis":
      return { ...state, diagnosis: action.value };
    case "setObservations":
      return { ...state, observations: action.value };
    case "startGenerate":
      return { ...state, busy: true };
    case "stopGenerate":
      return { ...state, busy: false };
    case "markGenerated":
      return { ...state, busy: false, generated: true };
    case "startWhatsApp":
      return { ...state, waSending: true };
    case "stopWhatsApp":
      return { ...state, waSending: false };
  }
}

export function CertificadoModal({
  visible,
  onClose,
  informeId,
  patientName,
  patientPhone,
  informeDoctor,
}: Props) {
  const { t, i18n } = useTranslation();
  const defaultDiagnosis = useMemo(
    () => extractDiagnosticoPresuntivo(informeDoctor) ?? "",
    [informeDoctor],
  );
  const [state, dispatch] = useReducer(reducer, defaultDiagnosis, initialState);
  const { daysOff, diagnosis, observations, busy, waSending, generated } = state;

  function buildOptions(): CertOptions {
    return {
      daysOff: daysOff.trim() ? parseInt(daysOff, 10) : null,
      diagnosis: diagnosis.trim() || null,
      observations: observations.trim() || null,
    };
  }

  async function handleGenerateAndShare() {
    dispatch({ type: "startGenerate" });
    try {
      await sharePdf({ kind: "certificado", informeId, options: buildOptions() });
      dispatch({ type: "markGenerated" });
    } catch (e) {
      dispatch({ type: "stopGenerate" });
      Alert.alert(
        t("certificado.errorTitle"),
        e instanceof Error ? e.message : String(e),
      );
    }
  }

  async function handleSendWhatsApp() {
    dispatch({ type: "startWhatsApp" });
    try {
      const res = await sendCertificadoWhatsApp({
        to: patientPhone!,
        informeId,
        patientName,
        locale: i18n.language ?? "es",
        certOptions: buildOptions(),
      });
      if (res.success) {
        Alert.alert(
          t("whatsappCertButton.successTitle"),
          t("whatsappCertButton.successMessage", { patientName }),
        );
      } else {
        Alert.alert(
          t("whatsappCertButton.errorTitle"),
          res.error ?? t("whatsappCertButton.errorMessage"),
        );
      }
    } catch (e) {
      Alert.alert(
        t("whatsappCertButton.errorTitle"),
        e instanceof Error ? e.message : t("whatsappCertButton.errorMessage"),
      );
    } finally {
      dispatch({ type: "stopWhatsApp" });
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={() => dispatch({ type: "reset", defaultDiagnosis })}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text variant="title">{t("certificado.title")}</Text>
            <Text variant="bodyMuted">
              {t("certificado.description", { patientName })}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityLabel={t("common.cancel")}
            hitSlop={8}
            style={styles.closeBtn}
          >
            <Icon name="close" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <FormField label={t("certificado.daysOffLabel")} hint={t("certificado.daysOffHint")}>
            <Input
              keyboardType="number-pad"
              placeholder={t("certificado.daysOffPlaceholder")}
              value={daysOff}
              onChangeText={(value) => dispatch({ type: "setDaysOff", value })}
              editable={!busy && !waSending}
            />
          </FormField>

          <FormField label={t("certificado.diagnosisLabel")} hint={t("certificado.diagnosisHint")}>
            <Input
              placeholder={t("certificado.diagnosisPlaceholder")}
              value={diagnosis}
              onChangeText={(value) => dispatch({ type: "setDiagnosis", value })}
              editable={!busy && !waSending}
            />
          </FormField>

          <FormField label={t("certificado.observationsLabel")}>
            <Input
              placeholder={t("certificado.observationsPlaceholder")}
              value={observations}
              onChangeText={(value) => dispatch({ type: "setObservations", value })}
              editable={!busy && !waSending}
              multiline
              numberOfLines={3}
              style={styles.multiline}
            />
          </FormField>

          {generated ? (
            <Card>
              <CardContent>
                <Text variant="label">{t("certificado.generatedTitle")}</Text>
                <Text variant="bodyMuted">
                  {t("certificado.generatedDescription", { patientName })}
                </Text>
                <View style={styles.successActions}>
                  <Button
                    title={t("certificado.generateAnother")}
                    variant="outline"
                    leftIcon={
                      <Icon name="refresh" size={16} color={colors.foreground} />
                    }
                    onPress={handleGenerateAndShare}
                    loading={busy}
                  />
                  {patientPhone ? (
                    <Button
                      title={t("whatsappCertButton.label")}
                      onPress={handleSendWhatsApp}
                      loading={waSending}
                      leftIcon={
                        <Icon
                          name="logo-whatsapp"
                          size={16}
                          color={colors.primaryForeground}
                        />
                      }
                    />
                  ) : null}
                </View>
              </CardContent>
            </Card>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={t("certificado.cancel")}
            variant="outline"
            onPress={onClose}
            disabled={busy || waSending}
          />
          <Button
            title={busy ? t("certificado.generating") : t("certificado.generate")}
            onPress={handleGenerateAndShare}
            loading={busy}
            leftIcon={
              <Icon
                name="document-text-outline"
                size={16}
                color={colors.primaryForeground}
              />
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: { flex: 1 },
  closeBtn: { padding: spacing.xs },
  body: { padding: spacing.xl, gap: spacing.lg },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  successActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
