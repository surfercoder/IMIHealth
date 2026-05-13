import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Screen, Text } from "@/src/components/ui";
import { PatientForm } from "@/src/components/PatientForm";
import { useAuth } from "@/src/providers/AuthProvider";
import { createPatient, type PatientInput } from "@/src/lib/api/patients";
import { spacing } from "@/src/theme";

export default function NewPatientScreen() {
  const { user } = useAuth();
  const { replace, back } = useRouter();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(values: PatientInput) {
    if (!user) return;
    setSubmitting(true);
    try {
      const created = await createPatient(user.id, values);
      replace({
        pathname: "/patient/[id]",
        params: { id: created.id },
      });
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen padded={false} hasHeader>
      <Stack.Screen
        options={{ title: t("nuevoInformeDialog.title"), headerShown: true }}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heading}>
          <Text variant="subtitle">{t("nuevoInformeDialog.description")}</Text>
        </View>
        <PatientForm
          onSubmit={onSubmit}
          submitting={submitting}
          submitLabel={t("nuevoInformeDialog.submit")}
          onCancel={() => back()}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, gap: spacing.md },
  heading: { gap: spacing.xs, marginBottom: spacing.md },
});
