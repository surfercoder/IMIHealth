import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardContent,
  Icon,
  Screen,
  Text,
} from "@/src/components/ui";
import { RecorderControls } from "@/src/components/RecorderControls";
import { useRecorder } from "@/src/hooks/useRecorder";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  createInforme,
  processInforme,
} from "@/src/lib/api/informes";
import { uploadRecording } from "@/src/lib/api/audio";
import { ApiError } from "@/src/lib/api/client";
import { colors, spacing } from "@/src/theme";

type UiStep =
  | { kind: "ready" }
  | { kind: "uploading" }
  | { kind: "processing" }
  | { kind: "done"; informeId: string }
  | { kind: "error"; message: string }
  | { kind: "transcriptionFailed" }
  | { kind: "insufficientContent" };

export default function RecordScreen() {
  const { t, i18n } = useTranslation();
  const { replace } = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ patientId?: string; mode?: "classic" | "quick" }>();
  const isQuick = params.mode === "quick" || !params.patientId;
  const recorder = useRecorder();
  const [step, setStep] = useState<UiStep>({ kind: "ready" });

  async function handleStop() {
    if (!user) return;
    const { uri, durationMs } = await recorder.stop();
    if (!uri) {
      setStep({ kind: "error", message: "Recording produced no file" });
      return;
    }

    setStep({ kind: "uploading" });
    try {
      const informe = await createInforme(
        user.id,
        isQuick ? null : (params.patientId as string),
      );
      const audioPath = await uploadRecording(uri, user.id, informe.id);

      setStep({ kind: "processing" });
      const result = await processInforme({
        informeId: informe.id,
        audioPath,
        language: i18n.language?.split("-")[0] ?? "es",
        recordingDuration: Math.round(durationMs / 1000),
      });

      if (result.transcriptionFailed) {
        setStep({ kind: "transcriptionFailed" });
        return;
      }
      if (result.insufficientContent) {
        setStep({ kind: "insufficientContent" });
        return;
      }
      setStep({ kind: "done", informeId: informe.id });
    } catch (e) {
      const message = e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e);
      setStep({ kind: "error", message });
    }
  }

  return (
    <Screen padded={false} hasHeader>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isQuick ? t("informes.quick") : t("grabarPage.newConsult"),
        }}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {step.kind === "ready" && (
          <>
            <View style={styles.intro}>
              <Text variant="title">{t("grabarPage.title")}</Text>
              <Text variant="subtitle">{t("grabarPage.subtitle")}</Text>
            </View>
            <Card>
              <CardContent>
                <Text variant="label">{t("grabarPage.howItWorks")}</Text>
                <Bullet text={t("grabarPage.step1")} />
                <Bullet text={t("grabarPage.step2")} />
                <Bullet text={t("grabarPage.step3")} />
                <Bullet text={t("grabarPage.step4")} />
              </CardContent>
            </Card>
            <View style={styles.controls}>
              <RecorderControls
                phase={recorder.phase}
                durationMs={recorder.durationMs}
                onStart={recorder.start}
                onStop={handleStop}
              />
              <Text variant="caption" center>
                {recorder.phase === "recording"
                  ? t("audioRecorder.stateRecording")
                  : t("audioRecorder.stateIdleHint")}
              </Text>
            </View>
          </>
        )}

        {(step.kind === "uploading" || step.kind === "processing") && (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text variant="title" center>
              {step.kind === "uploading"
                ? t("audioRecorder.stateUploading")
                : t("audioRecorder.stateProcessing")}
            </Text>
            <Text variant="subtitle" center>
              {t("informePage.processingHint")}
            </Text>
          </View>
        )}

        {step.kind === "done" && (
          <View style={styles.busy}>
            <Icon name="checkmark-circle" size={64} color={colors.success} />
            <Text variant="title" center>
              {t("audioRecorder.stateDone")}
            </Text>
            <Button
              title={t("common.back")}
              onPress={() =>
                replace({
                  pathname: "/informe/[id]",
                  params: { id: step.informeId },
                })
              }
              fullWidth
            />
          </View>
        )}

        {step.kind === "transcriptionFailed" && (
          <View style={styles.busy}>
            <Icon name="warning" size={56} color={colors.warning} />
            <Text variant="title" center>
              {t("informePage.errorProcessing")}
            </Text>
            <Text variant="subtitle" center>
              {t("audioRecorder.stateError")}
            </Text>
            <Button
              title={t("informePage.recordAgain")}
              variant="outline"
              onPress={() => {
                recorder.reset();
                setStep({ kind: "ready" });
              }}
              fullWidth
            />
          </View>
        )}

        {step.kind === "insufficientContent" && (
          <View style={styles.busy}>
            <Icon name="alert-circle" size={56} color={colors.warning} />
            <Text variant="title" center>
              {t("informePage.errorProcessing")}
            </Text>
            <Text variant="subtitle" center>
              {t("informePage.errorHint")}
            </Text>
            <Button
              title={t("informePage.recordAgain")}
              variant="outline"
              onPress={() => {
                recorder.reset();
                setStep({ kind: "ready" });
              }}
              fullWidth
            />
          </View>
        )}

        {step.kind === "error" && (
          <View style={styles.busy}>
            <Icon name="close-circle" size={56} color={colors.destructive} />
            <Text variant="title" center>
              {t("common.error")}
            </Text>
            <Text variant="subtitle" center>
              {step.message}
            </Text>
            <Button
              title={t("informePage.recordAgain")}
              variant="outline"
              onPress={() => {
                recorder.reset();
                setStep({ kind: "ready" });
              }}
              fullWidth
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bullet}>
      <View style={styles.dot} />
      <Text variant="body" style={styles.bulletText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, gap: spacing.lg },
  intro: { gap: spacing.xs },
  controls: { gap: spacing.lg, marginTop: spacing.xl, alignItems: "center" },
  busy: { alignItems: "center", gap: spacing.md, paddingVertical: spacing["3xl"] },
  bullet: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  bulletText: { flex: 1 },
});
