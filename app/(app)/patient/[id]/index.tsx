import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, type ListRenderItem, Pressable, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Divider,
  EmptyState,
  Icon,
  Screen,
  Text,
} from "@/src/components/ui";
import { InformeRow } from "@/src/components/InformeRow";
import { DictarPedidosModal } from "@/src/components/DictarPedidosModal";
import { usePatientDetail } from "@/src/hooks/usePatientDetail";
import { deletePatient } from "@/src/lib/api/patients";
import { getDoctorInitials } from "@/src/utils/avatar";
import { formatDate } from "@/src/utils/format";
import type { Informe } from "@/src/types";
import { colors, spacing } from "@/src/theme";

const separator = () => <View style={styles.separator} />;

export default function PatientDetailScreen() {
  const { push, back } = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const lang = i18n.language ?? "es";
  const { patient, informes, loading } = usePatientDetail(params.id);
  const [deleting, setDeleting] = useState(false);
  const [dictarOpen, setDictarOpen] = useState(false);

  async function handleDelete() {
    Alert.alert(
      t("common.delete"),
      t("patientDeleteConfirm.title", { defaultValue: "Delete this patient?" }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deletePatient(patient!.id);
              back();
            } catch (e) {
              Alert.alert(
                t("common.error"),
                e instanceof Error ? e.message : String(e),
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  const handlePressInforme = useCallback(
    (id: string) => {
      push({ pathname: "/informe/[id]", params: { id } });
    },
    [push],
  );

  const renderItem = useCallback<ListRenderItem<Informe>>(
    ({ item }) => <InformeRowItem informe={item} onPress={handlePressInforme} />,
    [handlePressInforme],
  );

  return (
    <Screen padded={false} hasHeader>
      <Stack.Screen
        options={{
          title: patient?.name ?? t("nav.patients"),
          headerShown: true,
          headerRight: () =>
            patient ? (
              <View style={styles.headerActions}>
                <Pressable
                  onPress={() =>
                    push({
                      pathname: "/patient/[id]/edit",
                      params: { id: patient.id },
                    })
                  }
                  hitSlop={8}
                  accessibilityLabel={t("common.edit")}
                >
                  <Icon name="create-outline" size={22} color={colors.foreground} />
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  disabled={deleting}
                  hitSlop={8}
                  accessibilityLabel={t("common.delete")}
                >
                  <Icon
                    name="trash-outline"
                    size={22}
                    color={deleting ? colors.mutedForeground : colors.destructive}
                  />
                </Pressable>
              </View>
            ) : null,
        }}
      />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !patient ? (
        <EmptyState title={t("status.unknownPatient")} />
      ) : (
        <FlatList
          data={informes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={separator}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.summary}>
                <Avatar
                  initials={getDoctorInitials(patient.name)}
                  size={56}
                />
                <View style={styles.summaryText}>
                  <Text variant="title">{patient.name}</Text>
                  <Text variant="subtitle">
                    {[patient.dni, patient.phone].filter(Boolean).join(" • ") || "—"}
                  </Text>
                </View>
              </View>
              <Card>
                <CardContent>
                  <View style={styles.kvRow}>
                    <Text variant="label">{t("patientPage.phone")}</Text>
                    <Text variant="body">{patient.phone ?? "—"}</Text>
                  </View>
                  <Divider />
                  <View style={styles.kvRow}>
                    <Text variant="label">{t("patientPage.email")}</Text>
                    <Text variant="body" numberOfLines={1}>
                      {patient.email ?? "—"}
                    </Text>
                  </View>
                  {patient.dob ? (
                    <>
                      <Divider />
                      <View style={styles.kvRow}>
                        <Text variant="label">
                          {t("nuevoInformeDialog.dob")}
                        </Text>
                        <Text variant="body">
                          {formatDate(patient.dob, lang)}
                        </Text>
                      </View>
                    </>
                  ) : null}
                  {patient.obra_social ? (
                    <>
                      <Divider />
                      <View style={styles.kvRow}>
                        <Text variant="label">
                          {t("nuevoInformeDialog.obraSocial")}
                        </Text>
                        <Text variant="body">{patient.obra_social}</Text>
                      </View>
                    </>
                  ) : null}
                </CardContent>
              </Card>
              <Button
                title={t("patientPage.newConsult")}
                onPress={() =>
                  push({
                    pathname: "/record",
                    params: { patientId: patient.id, mode: "classic" },
                  })
                }
                leftIcon={<Icon name="mic" size={18} color="#fff" />}
                fullWidth
                size="lg"
              />
              <Button
                title={t("dictarPedidos.trigger")}
                variant="outline"
                onPress={() => setDictarOpen(true)}
                leftIcon={
                  <Icon name="mic" size={18} color={colors.foreground} />
                }
                fullWidth
                size="lg"
              />
              <View style={styles.historyHeader}>
                <Text variant="title" style={styles.historyTitle}>
                  {t("patientPage.history")}
                </Text>
                <Badge label={`${informes.length}`} tone="neutral" />
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title={t("patientPage.noConsults")}
              description={t("patientPage.noConsultsHint")}
            />
          }
          renderItem={renderItem}
        />
      )}
      {patient ? (
        <DictarPedidosModal
          visible={dictarOpen}
          onClose={() => setDictarOpen(false)}
          patientId={patient.id}
          patientName={patient.name}
          patientPhone={patient.phone ?? null}
        />
      ) : null}
    </Screen>
  );
}

interface InformeRowItemProps {
  informe: Informe;
  onPress: (id: string) => void;
}

function InformeRowItem({ informe, onPress }: InformeRowItemProps) {
  const handlePress = useCallback(() => onPress(informe.id), [informe.id, onPress]);
  return <InformeRow informe={informe} onPress={handlePress} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: spacing.xl, flexGrow: 1 },
  header: { gap: spacing.lg, marginBottom: spacing.md },
  summary: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  summaryText: { flex: 1, gap: spacing.xs },
  separator: { height: spacing.md },
  kvRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  historyTitle: { fontSize: 16 },
  headerActions: { flexDirection: "row", gap: spacing.lg, marginRight: spacing.md },
});
