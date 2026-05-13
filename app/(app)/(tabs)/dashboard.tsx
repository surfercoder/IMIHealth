import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/src/components/AppHeader";
import { Screen, Text } from "@/src/components/ui";
import { StatCard } from "@/src/components/StatCard";
import { DashboardCharts } from "@/src/components/dashboard-charts";
import { useDashboard } from "@/src/hooks/useDashboard";
import { spacing } from "@/src/theme";

export default function DashboardTab() {
  const { t } = useTranslation();
  const { summary, charts, refreshing, refresh } = useDashboard();

  return (
    <Screen padded={false}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View style={styles.heading}>
          <Text variant="title">{t("dashboard.title")}</Text>
          <Text variant="subtitle">{t("dashboard.subtitle")}</Text>
        </View>

        <View style={styles.grid}>
          <StatCard
            label={t("home.stats.patients")}
            value={summary.totalPatients}
            icon="people-outline"
            tone="primary"
          />
          <StatCard
            label={t("home.stats.totalReports")}
            value={summary.totalInformes}
            icon="document-text-outline"
            tone="info"
          />
          <StatCard
            label={t("home.stats.completed")}
            value={summary.completedCount}
            icon="checkmark-circle-outline"
            tone="success"
          />
          <StatCard
            label={t("home.stats.processing")}
            value={summary.processingCount}
            icon="time-outline"
            tone="warning"
          />
          <StatCard
            label={t("home.stats.withErrors")}
            value={summary.errorCount}
            icon="alert-circle-outline"
            tone="destructive"
          />
        </View>

        <DashboardCharts data={charts} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg },
  heading: { gap: spacing.xs },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
});
