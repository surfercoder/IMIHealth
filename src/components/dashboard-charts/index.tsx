import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@/src/components/ui";
import { spacing } from "@/src/theme";
import type { ChartData } from "@/src/types";
import { PatientsOverTimeChart } from "./PatientsOverTimeChart";
import { ConsultationTimeChart } from "./ConsultationTimeChart";
import { PatientsAccumulatorChart } from "./PatientsAccumulatorChart";
import { InformTypesChart } from "./InformTypesChart";

interface Props {
  data: ChartData;
}

export function DashboardCharts({ data }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Text variant="title" style={styles.sectionTitle}>
        {t("charts.sectionTitle")}
      </Text>
      <View style={styles.grid}>
        <PatientsOverTimeChart data={data.patientsOverTime} />
        <ConsultationTimeChart data={data.consultationTime} />
        <PatientsAccumulatorChart data={data.patientsAccumulator} />
        <InformTypesChart data={data.informTypes} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  grid: { gap: spacing.md },
});
