import { useEffect, useReducer } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Screen } from "@/src/components/ui";
import { PatientForm } from "@/src/components/PatientForm";
import {
  getPatient,
  updatePatient,
  type PatientInput,
} from "@/src/lib/api/patients";
import type { Patient } from "@/src/types";
import { colors, spacing } from "@/src/theme";

interface State {
  patient: Patient | null;
  loading: boolean;
  submitting: boolean;
}

type Action =
  | { type: "startLoading" }
  | { type: "loaded"; patient: Patient | null }
  | { type: "setSubmitting"; value: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "startLoading":
      return { ...state, loading: true };
    case "loaded":
      return { patient: action.patient, loading: false, submitting: false };
    case "setSubmitting":
      return { ...state, submitting: action.value };
  }
}

const initialState: State = { patient: null, loading: true, submitting: false };

export default function EditPatientScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { back } = useRouter();
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { patient, loading, submitting } = state;

  useEffect(() => {
    if (!params.id) return;
    dispatch({ type: "startLoading" });
    getPatient(params.id).then((p) => {
      dispatch({ type: "loaded", patient: p });
    });
  }, [params.id]);

  async function onSubmit(values: PatientInput) {
    dispatch({ type: "setSubmitting", value: true });
    try {
      await updatePatient(patient!.id, values);
      back();
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : String(e));
    } finally {
      dispatch({ type: "setSubmitting", value: false });
    }
  }

  return (
    <Screen padded={false} hasHeader>
      <Stack.Screen
        options={{ title: t("common.edit"), headerShown: true }}
      />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !patient ? null : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <PatientForm
            initial={{
              name: patient.name,
              dni: patient.dni ?? "",
              dob: patient.dob ?? "",
              phone: patient.phone ?? "",
              email: patient.email ?? "",
              obra_social: patient.obra_social ?? "",
              nro_afiliado: patient.nro_afiliado ?? "",
              plan: patient.plan ?? "",
            }}
            onSubmit={onSubmit}
            submitting={submitting}
            onCancel={() => back()}
            submitLabel={t("common.save")}
          />
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
