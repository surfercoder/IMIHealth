import { useCallback, useEffect, useReducer } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Icon,
  Screen,
  Text,
} from "@/src/components/ui";
import { DoctorReportCard } from "@/src/components/informe/DoctorReportCard";
import { PatientReportCard } from "@/src/components/informe/PatientReportCard";
import { deleteInforme, getInforme, updateInformeContent } from "@/src/lib/api/informes";
import { getPatient } from "@/src/lib/api/patients";
import { getDoctor } from "@/src/lib/api/doctors";
import { useAuth } from "@/src/providers/AuthProvider";
import { formatDateTime } from "@/src/utils/format";
import type { Doctor, Informe, InformeStatus, Patient } from "@/src/types";
import { colors, spacing } from "@/src/theme";

const tone: Record<InformeStatus, "success" | "warning" | "destructive" | "info"> = {
  completed: "success",
  processing: "info",
  recording: "warning",
  error: "destructive",
};

interface State {
  informe: Informe | null;
  patient: Patient | null;
  doctor: Doctor | null;
  loading: boolean;
  doctorDraft: string;
  patientDraft: string;
  editing: "doctor" | "patient" | null;
  saving: boolean;
}

type Action =
  | { type: "startLoad" }
  | { type: "loaded"; informe: Informe | null; patient: Patient | null; doctor: Doctor | null }
  | { type: "setDoctorDraft"; value: string }
  | { type: "setPatientDraft"; value: string }
  | { type: "startEdit"; section: "doctor" | "patient" }
  | { type: "cancelEdit"; informe: Informe }
  | { type: "saveStart" }
  | { type: "saveDoctor"; value: string }
  | { type: "savePatient"; value: string }
  | { type: "saveFail" };

const initialState: State = {
  informe: null,
  patient: null,
  doctor: null,
  loading: true,
  doctorDraft: "",
  patientDraft: "",
  editing: null,
  saving: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "startLoad":
      return { ...state, loading: true };
    case "loaded":
      return {
        ...state,
        informe: action.informe,
        patient: action.patient,
        doctor: action.doctor,
        doctorDraft: action.informe?.informe_doctor ?? "",
        patientDraft: action.informe?.informe_paciente ?? "",
        loading: false,
      };
    case "setDoctorDraft":
      return { ...state, doctorDraft: action.value };
    case "setPatientDraft":
      return { ...state, patientDraft: action.value };
    case "startEdit":
      return { ...state, editing: action.section };
    case "cancelEdit":
      return {
        ...state,
        editing: null,
        doctorDraft: action.informe.informe_doctor ?? "",
        patientDraft: action.informe.informe_paciente ?? "",
      };
    case "saveStart":
      return { ...state, saving: true };
    case "saveDoctor":
      return {
        ...state,
        informe: state.informe && { ...state.informe, informe_doctor: action.value },
        saving: false,
        editing: null,
      };
    case "savePatient":
      return {
        ...state,
        informe: state.informe && { ...state.informe, informe_paciente: action.value },
        saving: false,
        editing: null,
      };
    case "saveFail":
      return { ...state, saving: false };
  }
}

export default function InformeDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { push, back } = useRouter();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const lang = i18n.language ?? "es";
  const [state, dispatch] = useReducer(reducer, initialState);
  const { informe, patient, doctor, loading, doctorDraft, patientDraft, editing, saving } = state;

  const load = useCallback(async () => {
    if (!params.id) return;
    dispatch({ type: "startLoad" });
    const data = await getInforme(params.id);
    const [pt, dr] = await Promise.all([
      data?.patient_id ? getPatient(data.patient_id) : Promise.resolve(null),
      user?.id ? getDoctor(user.id) : Promise.resolve(null),
    ]);
    dispatch({ type: "loaded", informe: data, patient: pt, doctor: dr });
  }, [params.id, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveDoctor = useCallback(async () => {
    dispatch({ type: "saveStart" });
    try {
      await updateInformeContent(informe!.id, { informe_doctor: doctorDraft });
      dispatch({ type: "saveDoctor", value: doctorDraft });
    } catch {
      dispatch({ type: "saveFail" });
    }
  }, [informe, doctorDraft]);

  const handleSavePatient = useCallback(async () => {
    dispatch({ type: "saveStart" });
    try {
      await updateInformeContent(informe!.id, { informe_paciente: patientDraft });
      dispatch({ type: "savePatient", value: patientDraft });
    } catch {
      dispatch({ type: "saveFail" });
    }
  }, [informe, patientDraft]);

  async function handleDelete() {
    Alert.alert(
      t("common.delete"),
      t("informeDeleteConfirm.title", { defaultValue: "Delete this report?" }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteInforme(informe!.id);
              back();
            } catch (e) {
              Alert.alert(
                t("common.error"),
                e instanceof Error ? e.message : String(e),
              );
            }
          },
        },
      ],
    );
  }

  return loading ? (
    <Screen hasHeader>
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    </Screen>
  ) : !informe ? (
    <Screen hasHeader>
      <Stack.Screen
        options={{ title: t("informePage.title"), headerShown: true }}
      />
      <EmptyState title={t("common.error")} description={t("informePage.errorHint")} />
    </Screen>
  ) : (
    <InformeBody
      informe={informe}
      patient={patient}
      doctor={doctor}
      editing={editing}
      saving={saving}
      doctorDraft={doctorDraft}
      patientDraft={patientDraft}
      lang={lang}
      onDoctorDraftChange={(value) => dispatch({ type: "setDoctorDraft", value })}
      onPatientDraftChange={(value) => dispatch({ type: "setPatientDraft", value })}
      onStartEdit={(section) => dispatch({ type: "startEdit", section })}
      onCancelEdit={() => dispatch({ type: "cancelEdit", informe })}
      onSaveDoctor={handleSaveDoctor}
      onSavePatient={handleSavePatient}
      onRecordAgain={() =>
        push({
          pathname: "/record",
          params: {
            patientId: informe.patient_id ?? undefined,
            mode: informe.patient_id ? "classic" : "quick",
          },
        })
      }
      onDelete={handleDelete}
    />
  );
}

interface InformeBodyProps {
  informe: Informe;
  patient: Patient | null;
  doctor: Doctor | null;
  editing: "doctor" | "patient" | null;
  saving: boolean;
  doctorDraft: string;
  patientDraft: string;
  lang: string;
  onDoctorDraftChange: (value: string) => void;
  onPatientDraftChange: (value: string) => void;
  onStartEdit: (section: "doctor" | "patient") => void;
  onCancelEdit: () => void;
  onSaveDoctor: () => void;
  onSavePatient: () => void;
  onRecordAgain: () => void;
  onDelete: () => void;
}

function InformeBody({
  informe,
  patient,
  doctor,
  editing,
  saving,
  doctorDraft,
  patientDraft,
  lang,
  onDoctorDraftChange,
  onPatientDraftChange,
  onStartEdit,
  onCancelEdit,
  onSaveDoctor,
  onSavePatient,
  onRecordAgain,
  onDelete,
}: InformeBodyProps) {
  const { t } = useTranslation();
  const isReady = informe.status === "completed";
  const doctorContent = informe.informe_doctor ?? "";
  const patientContent = informe.informe_paciente ?? "";
  const patientName = patient?.name ?? "";
  const consentBlock = patientName
    ? `\n\n---\n${t("informeEditor.consentLabel")}\n${t("informeEditor.consentTextImplicit", { patientName })}`
    : "";

  const handleStartEditDoctor = useCallback(() => onStartEdit("doctor"), [onStartEdit]);
  const handleStartEditPatient = useCallback(() => onStartEdit("patient"), [onStartEdit]);

  return (
    <Screen padded={false} hasHeader>
      <Stack.Screen
        options={{
          title: t("informePage.title"),
          headerShown: true,
          headerRight: () => (
            <Pressable
              onPress={onDelete}
              hitSlop={8}
              accessibilityLabel={t("common.delete")}
              style={styles.headerAction}
            >
              <Icon name="trash-outline" size={22} color={colors.destructive} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.meta}>
          <Badge
            label={
              t(`status.${informe.status}` as never, {
                defaultValue: informe.status,
              }) as string
            }
            tone={tone[informe.status]}
          />
          <Text variant="caption">{formatDateTime(informe.created_at, lang)}</Text>
        </View>

        {informe.status === "processing" || informe.status === "recording" ? (
          <Card>
            <CardContent>
              <Text variant="label">{t("informePage.processing")}</Text>
              <Text variant="bodyMuted">{t("informePage.processingHint")}</Text>
            </CardContent>
          </Card>
        ) : informe.status === "error" ? (
          <Card>
            <CardContent>
              <Text variant="label">{t("informePage.errorProcessing")}</Text>
              <Text variant="bodyMuted">{t("informePage.errorHint")}</Text>
              <Button
                title={t("informePage.recordAgain")}
                variant="outline"
                onPress={onRecordAgain}
                fullWidth
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <DoctorReportCard
              doctor={doctor}
              editing={editing === "doctor"}
              saving={saving}
              isReady={isReady}
              content={doctorContent}
              draft={doctorDraft}
              consentBlock={consentBlock}
              onDraftChange={onDoctorDraftChange}
              onStartEdit={handleStartEditDoctor}
              onCancel={onCancelEdit}
              onSave={onSaveDoctor}
            />
            <PatientReportCard
              informeId={informe.id}
              doctor={doctor}
              patient={patient}
              editing={editing === "patient"}
              saving={saving}
              isReady={isReady}
              content={patientContent}
              doctorContent={doctorContent}
              draft={patientDraft}
              onDraftChange={onPatientDraftChange}
              onStartEdit={handleStartEditPatient}
              onCancel={onCancelEdit}
              onSave={onSavePatient}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, gap: spacing.lg },
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerAction: { marginRight: spacing.md },
});
