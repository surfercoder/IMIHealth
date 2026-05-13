import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  getDashboardChartData,
  getDashboardSummary,
} from "@/src/lib/api/dashboard";
import type { ChartData, DashboardSummary } from "@/src/types";

const emptySummary: DashboardSummary = {
  totalPatients: 0,
  totalInformes: 0,
  completedCount: 0,
  processingCount: 0,
  errorCount: 0,
};

const emptyCharts: ChartData = {
  patientsOverTime: [],
  consultationTime: { avg: 0, min: 0, max: 0, data: [] },
  patientsAccumulator: { current: [], average: 0 },
  informTypes: [
    { type: "classic", count: 0 },
    { type: "quick", count: 0 },
  ],
};

export function useDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [charts, setCharts] = useState<ChartData>(emptyCharts);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!user) return;
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      const [summaryData, chartData] = await Promise.all([
        getDashboardSummary(user.id),
        getDashboardChartData(user.id),
      ]);
      setSummary(summaryData);
      setCharts(chartData);
      setLoading(false);
      setRefreshing(false);
    },
    [user],
  );

  const refresh = useCallback(() => load("refresh"), [load]);

  useEffect(() => {
    load("initial");
  }, [load]);

  return {
    summary,
    charts,
    loading,
    refreshing,
    refresh,
  };
}
