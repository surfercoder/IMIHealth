import { StyleSheet, View, useWindowDimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui";
import { colors, spacing } from "@/src/theme";
import type { ChartData } from "@/src/types";
import { formatDateLabel } from "./helpers";

interface Props {
  data: ChartData["patientsOverTime"];
}

export function PatientsOverTimeChart({ data }: Props) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(width - spacing.xl * 4, 240);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("charts.patientsOverTime")}</CardTitle>
          <CardDescription>{t("charts.patientsOverTimeDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <View style={styles.empty}>
            <Text variant="caption">{t("charts.noData")}</Text>
          </View>
        </CardContent>
      </Card>
    );
  }

  const step = Math.max(1, Math.ceil(data.length / 6));
  const items = data.map((p, i) => ({
    value: p.total,
    label: i % step === 0 ? formatDateLabel(p.date) : "",
    dataPointText: undefined,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("charts.patientsOverTime")}</CardTitle>
        <CardDescription>{t("charts.patientsOverTimeDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <View style={styles.chartWrap}>
          <LineChart
            areaChart
            data={items}
            width={chartWidth}
            height={200}
            initialSpacing={10}
            spacing={Math.max(20, (chartWidth - 40) / Math.max(1, items.length - 1))}
            color={colors.chart2}
            thickness={2}
            startFillColor={colors.chart2}
            endFillColor={colors.chart2}
            startOpacity={0.8}
            endOpacity={0.1}
            hideDataPoints
            yAxisColor="transparent"
            xAxisColor={colors.border}
            yAxisTextStyle={styles.axisText}
            xAxisLabelTextStyle={styles.axisText}
            rulesColor={colors.border}
            rulesType="solid"
            noOfSections={4}
            curved
          />
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  chartWrap: { marginLeft: -spacing.sm },
  empty: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  axisText: { color: colors.mutedForeground, fontSize: 10 },
});
