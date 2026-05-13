import { StyleSheet, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
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
  data: ChartData["informTypes"];
}

const TYPE_COLORS: Record<"classic" | "quick", string> = {
  classic: colors.chart1,
  quick: colors.chart2,
};

export function InformTypesChart({ data }: Props) {
  const { t } = useTranslation();
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("charts.informTypes")}</CardTitle>
        <CardDescription>{t("charts.informTypesDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <View style={styles.empty}>
            <Text variant="caption">{t("charts.noData")}</Text>
          </View>
        ) : (
          <>
            <View style={styles.chartWrap}>
              <PieChart
                data={data.map((d) => ({
                  value: d.count,
                  color: TYPE_COLORS[d.type],
                  text: String(d.count),
                  textColor: "#ffffff",
                  textSize: 14,
                }))}
                donut
                radius={90}
                innerRadius={48}
                innerCircleColor={colors.card}
                showText
                centerLabelComponent={() => (
                  <View style={styles.center}>
                    <Text style={styles.centerValue}>{total}</Text>
                    <Text style={styles.centerLabel}>
                      {t("charts.informTypes")}
                    </Text>
                  </View>
                )}
              />
            </View>
            <View style={styles.legend}>
              {(["classic", "quick"] as const).map((key) => (
                <View key={key} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: TYPE_COLORS[key] },
                    ]}
                  />
                  <Text style={styles.legendText}>
                    {t(
                      key === "classic"
                        ? "charts.classicInforms"
                        : "charts.quickInforms",
                    )}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  empty: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  chartWrap: { alignItems: "center", paddingVertical: spacing.sm },
  center: { alignItems: "center" },
  centerValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground,
  },
  centerLabel: {
    fontSize: 10,
    color: colors.mutedForeground,
    marginTop: 2,
    textAlign: "center",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 13,
    color: colors.foreground,
  },
});
