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
  data: ChartData["patientsAccumulator"];
}

export function PatientsAccumulatorChart({ data }: Props) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(width - spacing.xl * 4, 240);

  if (data.current.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("charts.dailyPatients")}</CardTitle>
          <CardDescription>
            {t("charts.dailyPatientsDesc", { avg: data.average })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <View style={styles.empty}>
            <Text variant="caption">{t("charts.noData")}</Text>
          </View>
        </CardContent>
      </Card>
    );
  }

  const step = Math.max(1, Math.ceil(data.current.length / 6));
  const items = data.current.map((p, i) => ({
    value: p.patients,
    label: i % step === 0 ? formatDateLabel(p.date) : "",
  }));

  const maxVal = Math.max(...data.current.map((d) => d.patients), data.average);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("charts.dailyPatients")}</CardTitle>
        <CardDescription>
          {t("charts.dailyPatientsDesc", { avg: data.average })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <View style={styles.chartWrap}>
          <LineChart
            data={items}
            width={chartWidth}
            height={200}
            initialSpacing={10}
            spacing={Math.max(20, (chartWidth - 40) / Math.max(1, items.length - 1))}
            color={colors.chart3}
            thickness={2}
            dataPointsColor={colors.chart3}
            dataPointsRadius={4}
            yAxisColor="transparent"
            xAxisColor={colors.border}
            yAxisTextStyle={styles.axisText}
            xAxisLabelTextStyle={styles.axisText}
            rulesColor={colors.border}
            rulesType="solid"
            noOfSections={4}
            maxValue={Math.ceil(maxVal * 1.1) || 1}
            curved
            showReferenceLine1
            referenceLine1Position={data.average}
            referenceLine1Config={{
              color: colors.chart5,
              dashWidth: 4,
              dashGap: 4,
              labelText: `${t("charts.avg")}: ${data.average}`,
              labelTextStyle: {
                color: colors.chart5,
                fontSize: 10,
              },
            }}
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
