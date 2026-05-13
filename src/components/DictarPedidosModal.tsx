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
import { useDictation, type UseDictationResult } from "@/src/hooks/useDictation";
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
    dispatch({ type: "setWaSending", busy: true });
    try {
      const res = await sendPedidosPatientWhatsApp({
        to: patientPhone as string,
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
        <Header
          title={t("dictarPedidos.title")}
          description={t("dictarPedidos.description", { patientName })}
          cancelLabel={t("common.cancel")}
          onClose={handleClose}
        />

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {state.phase === "idle" && (
            <IdleSection
              dictation={dictation}
              onStart={handleStartRecording}
              onPause={dictation.pause}
              onResume={handleResume}
              onStop={handleStopRecording}
            />
          )}

          {state.phase === "generating" && (
            <View style={styles.busy}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text variant="title" center>
                {t("dictarPedidos.generating")}
              </Text>
            </View>
          )}

          {state.phase === "review" && (
            <ReviewSection
              itemsText={state.itemsText}
              diagnostico={state.diagnostico}
              itemCount={itemCount}
              onChangeItemsText={(value) =>
                dispatch({ type: "setItemsText", value })
              }
              onChangeDiagnostico={(value) =>
                dispatch({ type: "setDiagnostico", value })
              }
            />
          )}

          {state.phase === "success" && (
            <SuccessSection
              itemCount={itemCount}
              patientPhone={patientPhone}
              pdfBusy={state.pdfBusy}
              waSending={state.waSending}
              onViewPdf={handleViewPdf}
              onSendWhatsApp={handleSendWhatsApp}
              onGenerateAnother={handleResetToIdle}
            />
          )}
        </ScrollView>

        {state.phase === "review" && (
          <ReviewFooter
            itemCount={itemCount}
            onRecordAgain={handleResetToIdle}
            onGenerate={handleGenerate}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Header({
  title,
  description,
  cancelLabel,
  onClose,
}: {
  title: string;
  description: string;
  cancelLabel: string;
  onClose: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text variant="title">{title}</Text>
        <Text variant="bodyMuted">{description}</Text>
      </View>
      <Pressable
        onPress={onClose}
        accessibilityLabel={cancelLabel}
        hitSlop={8}
        style={styles.closeBtn}
      >
        <Icon name="close" size={24} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

function IdleSection({
  dictation,
  onStart,
  onPause,
  onResume,
  onStop,
}: {
  dictation: UseDictationResult;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}) {
  const { t } = useTranslation();
  const isRecording = dictation.phase === "recording";
  const isPaused = dictation.phase === "paused";
  const isIdle = dictation.phase === "idle";

  return (
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

        <RecordButtonRow
          isIdle={isIdle}
          isRecording={isRecording}
          isPaused={isPaused}
          onStart={onStart}
          onPause={onPause}
          onResume={onResume}
          onStop={onStop}
        />

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
  );
}

function RecordButtonRow({
  isIdle,
  isRecording,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
}: {
  isIdle: boolean;
  isRecording: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.buttonRow}>
      {isIdle && (
        <Pressable
          onPress={onStart}
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
            onPress={onPause}
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
            onPress={onStop}
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
            onPress={onResume}
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
            onPress={onStop}
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
  );
}

function ReviewSection({
  itemsText,
  diagnostico,
  itemCount,
  onChangeItemsText,
  onChangeDiagnostico,
}: {
  itemsText: string;
  diagnostico: string;
  itemCount: number;
  onChangeItemsText: (v: string) => void;
  onChangeDiagnostico: (v: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.reviewSection}>
      <FormField
        label={t("dictarPedidos.itemsLabel")}
        hint={t("dictarPedidos.itemsHint", { count: itemCount })}
      >
        <Input
          placeholder={t("dictarPedidos.itemsPlaceholder")}
          value={itemsText}
          onChangeText={onChangeItemsText}
          multiline
          numberOfLines={6}
          style={styles.multiline}
        />
      </FormField>
      <FormField label={t("dictarPedidos.diagnosticoLabel")}>
        <Input
          placeholder={t("dictarPedidos.diagnosticoPlaceholder")}
          value={diagnostico}
          onChangeText={onChangeDiagnostico}
          multiline
          numberOfLines={2}
          style={styles.multilineShort}
        />
      </FormField>
    </View>
  );
}

function SuccessSection({
  itemCount,
  patientPhone,
  pdfBusy,
  waSending,
  onViewPdf,
  onSendWhatsApp,
  onGenerateAnother,
}: {
  itemCount: number;
  patientPhone: string | null;
  pdfBusy: boolean;
  waSending: boolean;
  onViewPdf: () => void;
  onSendWhatsApp: () => void;
  onGenerateAnother: () => void;
}) {
  const { t } = useTranslation();
  return (
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
            onPress={onViewPdf}
            loading={pdfBusy}
          />
          {patientPhone ? (
            <Button
              title={t("whatsappPedidosButton.label")}
              onPress={onSendWhatsApp}
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
          <Button
            title={t("dictarPedidos.generateAnother")}
            variant="ghost"
            onPress={onGenerateAnother}
          />
        </View>
      </CardContent>
    </Card>
  );
}

function ReviewFooter({
  itemCount,
  onRecordAgain,
  onGenerate,
}: {
  itemCount: number;
  onRecordAgain: () => void;
  onGenerate: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.footer}>
      <Button
        title={t("dictarPedidos.recordAgain")}
        variant="outline"
        onPress={onRecordAgain}
        leftIcon={<Icon name="mic" size={16} color={colors.foreground} />}
      />
      <Button
        title={t("dictarPedidos.generate", { count: itemCount })}
        onPress={onGenerate}
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
