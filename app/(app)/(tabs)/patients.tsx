import { useCallback, useMemo, useState } from "react";
import { FlatList, type ListRenderItem, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/src/components/AppHeader";
import { EmptyState, Icon, Input, Screen, Text } from "@/src/components/ui";
import { PatientCard } from "@/src/components/PatientCard";
import { usePatients } from "@/src/hooks/usePatients";
import type { PatientWithStats } from "@/src/types";
import { colors, spacing } from "@/src/theme";

const emptyImage = require("@/assets/images/imi-bot-look-front-transparent.webp");
const separator = () => <View style={styles.separator} />;

export default function PatientsTab() {
  const { t } = useTranslation();
  const { push } = useRouter();
  const { patients, loading, refreshing, refresh } = usePatients();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      [p.name, p.dni, p.phone].some(
        (v) => v != null && String(v).toLowerCase().includes(q),
      ),
    );
  }, [patients, query]);

  const handlePressPatient = useCallback(
    (id: string) => {
      push({ pathname: "/patient/[id]", params: { id } });
    },
    [push],
  );

  const renderItem = useCallback<ListRenderItem<PatientWithStats>>(
    ({ item }) => <PatientRow patient={item} onPress={handlePressPatient} />,
    [handlePressPatient],
  );

  return (
    <Screen padded={false}>
      <AppHeader />
      <View style={styles.heading}>
        <Text variant="title">{t("home.patientsTitle")}</Text>
        <Text variant="subtitle">{t("patients.subtitle")}</Text>
      </View>
      <View style={styles.search}>
        <Input
          placeholder={t("patientsList.searchPlaceholder")}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          leftIcon={
            <Icon name="search" size={18} color={colors.mutedForeground} />
          }
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={separator}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        ListEmptyComponent={
          loading ? null : query ? (
            <EmptyState
              title={t("patientsList.noSearchResults", { query })}
              description={t("patientSearch.noResultsHint")}
            />
          ) : (
            <EmptyState
              image={emptyImage}
              title={t("patientsList.empty")}
              description={t("patientsList.emptySubtitle")}
            />
          )
        }
      />
      <Pressable
        onPress={() => push("/patient/new")}
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel={t("nuevoInformeDialog.trigger")}
      >
        <Icon name="add" size={28} color={colors.primaryForeground} />
      </Pressable>
    </Screen>
  );
}

interface PatientRowProps {
  patient: PatientWithStats;
  onPress: (id: string) => void;
}

function PatientRow({ patient, onPress }: PatientRowProps) {
  const handlePress = useCallback(() => onPress(patient.id), [patient.id, onPress]);
  return <PatientCard patient={patient} onPress={handlePress} />;
}

const styles = StyleSheet.create({
  heading: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  search: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  list: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    flexGrow: 1,
  },
  separator: { height: spacing.md },
  fab: {
    position: "absolute",
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 10px rgba(15, 23, 42, 0.16)",
  },
});
