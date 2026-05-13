import { StyleSheet, View, useWindowDimensions } from "react-native";
import { BarChart } from "react-native-gifted-charts";
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

interface Props {
  data: ChartData["consultationTime"];
}

export function ConsultationTimeChart({ data }: Props) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(width - spacing.xl * 4, 240);

  const hasData = data.data.length > 0;

  const bars = [
    {
      value: data.avg,
      label: t("charts.average"),
      frontColor: colors.chart2,
      topLabelComponent: () => (
        <Text style={styles.barLabel}>{data.avg}</Text>
      ),
    },
    {
      value: data.min,
      label: t("charts.minimum"),
      frontColor: colors.chart4,
      topLabelComponent: () => (
        <Text style={styles.barLabel}>{data.min}</Text>
      ),
    },
    {
      value: data.max,
      label: t("charts.maximum"),
      frontColor: colors.chart1,
      topLabelComponent: () => (
        <Text style={styles.barLabel}>{data.max}</Text>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("charts.consultationTime")}</CardTitle>
        <CardDescription>{t("charts.consultationTimeDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            <View style={styles.chartWrap}>
              <BarChart
                data={bars}
                width={chartWidth}
                height={180}
                barWidth={Math.min(56, (chartWidth - 80) / 3)}
                spacing={24}
                roundedTop
                hideRules={false}
                rulesColor={colors.border}
                rulesType="solid"
                yAxisColor="transparent"
                xAxisColor={colors.border}
                yAxisTextStyle={styles.axisText}
                xAxisLabelTextStyle={styles.axisText}
                noOfSections={4}
                yAxisLabelSuffix=" min"
                disablePress
              />
            </View>
            <Text style={styles.footnote}>
              {t("charts.basedOn", { count: data.data.length })}
            </Text>
          </>
        ) : (
          <View style={styles.empty}>
            <Text variant="caption">{t("charts.noData")}</Text>
          </View>
        )}
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
  barLabel: {
    fontSize: 10,
    color: colors.mutedForeground,
    marginBottom: 2,
  },
  footnote: {
    fontSize: 11,
    color: colors.mutedForeground,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
