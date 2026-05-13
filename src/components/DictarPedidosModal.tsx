import { useCallback, useReducer } from "react";
import {
  ActivityIndicator,
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
import {
  Button,
  Card,
  CardContent,
  FormField,
  Icon,
  Input,
  Text,
} from "@/src/components/ui";
import { useDictation } from "@/src/hooks/useDictation";
import { formatDuration } from "@/src/hooks/useRecorder";
import { sharePdf } from "@/src/lib/api/pdf";
import { sendPedidosPatientWhatsApp } from "@/src/lib/api/whatsapp";
import {
  itemsToText,
  parseDictation,
  parseItemsText,
} from "@/src/lib/pedidos-parse";
import { colors, radius, spacing } from "@/src/theme";

type Phase = "idle" | "review" | "generating" | "success";

interface State {
  phase: Phase;
  itemsText: string;
  diagnostico: string;
  pdfBusy: boolean;
  waSending: boolean;
}

type Action =
  | { type: "reset" }
  | { type: "setPhase"; phase: Phase }
  | { type: "stopAndReview"; itemsText: string; diagnostico: string }
  | { type: "setItemsText"; value: string }
  | { type: "setDiagnostico"; value: string }
  | { type: "setPdfBusy"; busy: boolean }
  | { type: "setWaSending"; busy: boolean };

const initialState: State = {
  phase: "idle",
  itemsText: "",
  diagnostico: "",
  pdfBusy: false,
  waSending: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset":
      return initialState;
    case "setPhase":
      return { ...state, phase: action.phase };
    case "stopAndReview":
      return {
        ...state,
        phase: "review",
        itemsText: action.itemsText,
        diagnostico: action.diagnostico,
      };
    case "setItemsText":
      return { ...state, itemsText: action.value };
    case "setDiagnostico":
      return { ...state, diagnostico: action.value };
    case "setPdfBusy":
      return { ...state, pdfBusy: action.busy };
    case "setWaSending":
      return { ...state, waSending: action.busy };
  }
}

interface Props {
  visible: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientPhone: string | null;
}

function speechLangFor(localeCode: string): string {
  const base = (localeCode || "es").split("-")[0].toLowerCase();
  // `es-AR` is not in iOS SFSpeechRecognizer's supported list — use Latin
  // American Spanish (`es-419`) as the neutral fallback for Spanish.
  return base === "en" ? "en-US" : "es-419";
}

export function DictarPedidosModal({
  visible,
  onClose,
  patientId,
  patientName,
  patientPhone,
}: Props) {
  const { t, i18n } = useTranslation();
  const dictation = useDictation();
  const [state, dispatch] = useReducer(reducer, initialState);

  const items = parseItemsText(state.itemsText);
  const itemCount = items.length;
  const isRecording = dictation.phase === "recording";
  const isPaused = dictation.phase === "paused";
  const isIdle = dictation.phase === "idle";
  const isWorking = state.phase === "generating";

  async function handleStartRecording() {
    try {
      await dictation.start({ language: speechLangFor(i18n.language ?? "es") });
    } catch (e) {
      Alert.alert(
        t("dictarPedidos.micErrorTitle"),
        e instanceof Error ? e.message : String(e),
      );
    }
  }

  function handlePause() {
    dictation.pause();
  }

  async function handleResume() {
    try {
      await dictation.resume();
    } catch (e) {
      Alert.alert(
        t("dictarPedidos.micErrorTitle"),
        e instanceof Error ? e.message : String(e),
      );
    }
  }

  function handleStopRecording() {
    const transcript = dictation.stop();
    const parsed = parseDictation(transcript);
    dispatch({
      type: "stopAndReview",
      itemsText: itemsToText(parsed.items),
      diagnostico: parsed.diagnostico ?? "",
    });
  }

  function handleResetToIdle() {
    dictation.reset();
    dispatch({ type: "reset" });
  }

  function handleClose() {
    dictation.reset();
    dispatch({ type: "reset" });
    onClose();
  }

  async function handleGenerate() {
    if (itemCount === 0) return;
    const diagnostico = state.diagnostico.trim() || null;
    dispatch({ type: "setPhase", phase: "generating" });
    try {
      await sharePdf({
        kind: "pedidos-patient",
        patientId,
        items,
        diagnostico,
      });
      dispatch({ type: "setPhase", phase: "success" });
    } catch (e) {
      Alert.alert(
        t("dictarPedidos.errorTitle"),
        e instanceof Error ? e.message : String(e),
      );
      dispatch({ type: "setPhase", phase: "review" });
    }
  }

  const handleViewPdf = useCallback(async () => {
    dispatch({ type: "setPdfBusy", busy: true });
    try {
      await sharePdf({
        kind: "pedidos-patient",
        patientId,
        items,
        diagnostico: state.diagnostico.trim() || null,
      });
    } catch (e) {
      Alert.alert(
        t("common.error"),
        e instanceof Error ? e.message : String(e),
      );
    } finally {
      dispatch({ type: "setPdfBusy", busy: false });
    }
  }, [patientId, items, state.diagnostico, t]);

  async function handleSendWhatsApp() {
    if (!patientPhone) return;
    dispatch({ type: "setWaSending", busy: true });
    try {
      const res = await sendPedidosPatientWhatsApp({
        to: patientPhone,
        patientId,
        patientName,
        locale: i18n.language ?? "es",
        pedidoItems: items,
        diagnostico: state.diagnostico.trim() || null,
      });
      if (res.success) {
        Alert.alert(
          t("whatsappPedidosButton.successTitle"),
          t("whatsappPedidosButton.successMessage", {
            patientName,
            count: items.length,
          }),
        );
      } else {
        Alert.alert(
          t("whatsappPedidosButton.errorTitle"),
          res.error ?? t("whatsappPedidosButton.errorMessage"),
        );
      }
    } catch (e) {
      Alert.alert(
        t("whatsappPedidosButton.errorTitle"),
        e instanceof Error ? e.message : t("whatsappPedidosButton.errorMessage"),
      );
    } finally {
      dispatch({ type: "setWaSending", busy: false });
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text variant="title">{t("dictarPedidos.title")}</Text>
            <Text variant="bodyMuted">
              {t("dictarPedidos.description", { patientName })}
            </Text>
          </View>
          <Pressable
            onPress={handleClose}
            accessibilityLabel={t("common.cancel")}
            hitSlop={8}
            style={styles.closeBtn}
          >
            <Icon name="close" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {state.phase === "idle" && (
            <View style={styles.recordSection}>
              <View style={styles.recordControls}>
                {(isRecording || isPaused) && (
                  <Text
                    style={[
                      styles.timer,
                      isPaused ? styles.timerPaused : styles.timerRecording,
                    ]}
                  >
                    {formatDuration(dictation.durationMs)}
                  </Text>
                )}

                <View style={styles.buttonRow}>
                  {isIdle && (
                    <Pressable
                      onPress={handleStartRecording}
                      accessibilityRole="button"
                      accessibilityLabel={t("dictarPedidos.btnStart")}
                      style={({ pressed }) => [
                        styles.recordBtn,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Icon name="mic" size={36} color="#fff" />
                    </Pressable>
                  )}

                  {isRecording && (
                    <>
                      <Pressable
                        onPress={handlePause}
                        accessibilityRole="button"
                        accessibilityLabel={t("dictarPedidos.btnPause")}
                        style={({ pressed }) => [
                          styles.secondaryBtn,
                          pressed && styles.btnPressed,
                        ]}
                      >
                        <Icon name="pause" size={24} color={colors.foreground} />
                      </Pressable>
                      <Pressable
                        onPress={handleStopRecording}
                        accessibilityRole="button"
                        accessibilityLabel={t("dictarPedidos.btnStop")}
                        style={({ pressed }) => [
                          styles.recordBtn,
                          pressed && styles.btnPressed,
                        ]}
                      >
                        <View style={styles.stopSquare} />
                      </Pressable>
                    </>
                  )}

                  {isPaused && (
                    <>
                      <Pressable
                        onPress={handleResume}
                        accessibilityRole="button"
                        accessibilityLabel={t("dictarPedidos.btnResume")}
                        style={({ pressed }) => [
                          styles.secondaryBtn,
                          pressed && styles.btnPressed,
                        ]}
                      >
                        <Icon name="mic" size={22} color={colors.foreground} />
                      </Pressable>
                      <Pressable
                        onPress={handleStopRecording}
                        accessibilityRole="button"
                        accessibilityLabel={t("dictarPedidos.btnStop")}
                        style={({ pressed }) => [
                          styles.recordBtn,
                          pressed && styles.btnPressed,
                        ]}
                      >
                        <View style={styles.stopSquare} />
                      </Pressable>
                    </>
                  )}
                </View>

                <Text variant="bodyMuted" center>
                  {isRecording
                    ? t("dictarPedidos.recordingHint")
                    : isPaused
                      ? t("dictarPedidos.pausedHint")
                      : t("dictarPedidos.idleHint")}
                </Text>
              </View>

              {(isRecording || isPaused) && dictation.liveTranscript.length > 0 && (
                <Card style={styles.transcriptCard}>
                  <CardContent style={styles.transcriptContent}>
                    <Text variant="label" style={styles.transcriptLabel}>
                      {t("dictarPedidos.liveTranscript")}
                    </Text>
                    <Text variant="body" style={styles.transcriptText}>
                      {dictation.liveTranscript}
                    </Text>
                  </CardContent>
                </Card>
              )}

              {dictation.error && (
                <Card style={styles.transcriptCard}>
                  <CardContent style={styles.transcriptContent}>
                    <Text variant="label" style={styles.errorLabel}>
                      {t("dictarPedidos.micErrorTitle")}
                    </Text>
                    <Text variant="body" style={styles.transcriptText}>
                      {dictation.error}
                    </Text>
                  </CardContent>
                </Card>
              )}

              <Card style={styles.instructionsCard}>
                <CardContent style={styles.instructionsContent}>
                  <Text variant="label" style={styles.instructionsTitle}>
                    {t("dictarPedidos.howItWorks")}
                  </Text>
                  <NumberedStep index={1} text={t("dictarPedidos.step1")} />
                  <NumberedStep index={2} text={t("dictarPedidos.step2")} />
                  <NumberedStep index={3} text={t("dictarPedidos.step3")} />
                  <NumberedStep index={4} text={t("dictarPedidos.step4")} />
                </CardContent>
              </Card>
            </View>
          )}

          {isWorking && (
            <View style={styles.busy}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text variant="title" center>
                {t("dictarPedidos.generating")}
              </Text>
            </View>
          )}

          {state.phase === "review" && (
            <View style={styles.reviewSection}>
              <FormField
                label={t("dictarPedidos.itemsLabel")}
                hint={t("dictarPedidos.itemsHint", { count: itemCount })}
              >
                <Input
                  placeholder={t("dictarPedidos.itemsPlaceholder")}
                  value={state.itemsText}
                  onChangeText={(value) =>
                    dispatch({ type: "setItemsText", value })
                  }
                  multiline
                  numberOfLines={6}
                  style={styles.multiline}
                />
              </FormField>
              <FormField label={t("dictarPedidos.diagnosticoLabel")}>
                <Input
                  placeholder={t("dictarPedidos.diagnosticoPlaceholder")}
                  value={state.diagnostico}
                  onChangeText={(value) =>
                    dispatch({ type: "setDiagnostico", value })
                  }
                  multiline
                  numberOfLines={2}
                  style={styles.multilineShort}
                />
              </FormField>
            </View>
          )}

          {state.phase === "success" && (
            <Card>
              <CardContent>
                <View style={styles.successIcon}>
                  <Icon
                    name="document-text-outline"
                    size={36}
                    color={colors.primary}
                  />
                </View>
                <Text variant="title" center>
                  {t("dictarPedidos.successMessage")}
                </Text>
                <Text variant="bodyMuted" center>
                  {t("dictarPedidos.pedidoCount", { count: itemCount })}
                </Text>
                <View style={styles.successActions}>
                  <Button
                    title={t("dictarPedidos.viewOnline")}
                    variant="outline"
                    leftIcon={
                      <Icon
                        name="documents-outline"
                        size={16}
                        color={colors.foreground}
                      />
                    }
                    onPress={handleViewPdf}
                    loading={state.pdfBusy}
                  />
                  {patientPhone ? (
                    <Button
                      title={t("whatsappPedidosButton.label")}
                      onPress={handleSendWhatsApp}
                      loading={state.waSending}
                      leftIcon={
                        <Icon
                          name="logo-whatsapp"
                          size={16}
                          color={colors.primaryForeground}
                        />
                      }
                    />
                  ) : null}
                  <Button
                    title={t("dictarPedidos.generateAnother")}
                    variant="ghost"
                    onPress={handleResetToIdle}
                  />
                </View>
              </CardContent>
            </Card>
          )}
        </ScrollView>

        {state.phase === "review" && (
          <View style={styles.footer}>
            <Button
              title={t("dictarPedidos.recordAgain")}
              variant="outline"
              onPress={handleResetToIdle}
              leftIcon={<Icon name="mic" size={16} color={colors.foreground} />}
            />
            <Button
              title={t("dictarPedidos.generate", { count: itemCount })}
              onPress={handleGenerate}
              disabled={itemCount === 0}
              leftIcon={
                <Icon
                  name="document-text-outline"
                  size={16}
                  color={colors.primaryForeground}
                />
              }
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function NumberedStep({ index, text }: { index: number; text: string }) {
  return (
    <View style={styles.step}>
      <Text variant="body" style={styles.stepIndex}>
        {`${index}.`}
      </Text>
      <Text variant="body" style={styles.stepText}>
        {text}
      </Text>
    </View>
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
  recordSection: { gap: spacing.lg },
  recordControls: { alignItems: "center", gap: spacing.lg },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  instructionsCard: { alignSelf: "stretch" },
  instructionsContent: { paddingTop: spacing.lg, gap: 0 },
  instructionsTitle: { marginBottom: spacing.xs },
  timer: {
    fontSize: 36,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  timerRecording: { color: colors.destructive },
  timerPaused: { color: colors.primary },
  recordBtn: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.destructive,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 14px rgba(15, 23, 42, 0.18)",
  },
  secondaryBtn: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.12)",
  },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  stopSquare: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  transcriptCard: { alignSelf: "stretch" },
  transcriptContent: { gap: spacing.xs, paddingVertical: spacing.md },
  transcriptLabel: { color: colors.mutedForeground },
  errorLabel: { color: colors.destructive },
  transcriptText: { color: colors.foreground, lineHeight: 22 },
  step: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
    marginTop: spacing.sm,
  },
  stepIndex: {
    color: colors.mutedForeground,
    minWidth: 20,
  },
  stepText: {
    flex: 1,
    flexWrap: "wrap",
    color: colors.mutedForeground,
  },
  busy: { alignItems: "center", gap: spacing.md, paddingVertical: spacing["3xl"] },
  reviewSection: { gap: spacing.lg },
  multiline: {
    minHeight: 140,
    textAlignVertical: "top",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    fontSize: 13,
  },
  multilineShort: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  successIcon: {
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(15, 23, 42, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  successActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
