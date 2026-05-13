import { render } from "@testing-library/react-native";

let lastBarChartData: { topLabelComponent?: () => React.ReactNode }[] = [];

jest.mock("react-native-gifted-charts", () => {
  return {
    LineChart: () => null,
    BarChart: (p: { data: { topLabelComponent?: () => React.ReactNode }[] }) => {
      lastBarChartData = p.data;
      return null;
    },
    PieChart: () => null,
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { ConsultationTimeChart } from "@/src/components/dashboard-charts/ConsultationTimeChart";
import { PatientsAccumulatorChart } from "@/src/components/dashboard-charts/PatientsAccumulatorChart";

describe("BarChart-driven inner functions", () => {
  it("ConsultationTimeChart's topLabelComponent functions render labels", () => {
    render(
      <ConsultationTimeChart
        data={{
          avg: 12.3,
          min: 5,
          max: 30,
          data: [{ date: "2024-01-01", minutes: 12 }],
        }}
      />,
    );
    expect(lastBarChartData.length).toBe(3);
    // Each bar has a topLabelComponent — render them.
    for (const bar of lastBarChartData) {
      const node = bar.topLabelComponent?.();
      render(<>{node}</>);
    }
  });

  it("PatientsAccumulatorChart's topLabelComponent functions render labels", () => {
    render(
      <PatientsAccumulatorChart
        data={{
          current: [
            { date: "2024-01-01", patients: 2 },
            { date: "2024-01-02", patients: 4 },
          ],
          average: 3,
        }}
      />,
    );
    for (const bar of lastBarChartData) {
      const node = bar.topLabelComponent?.();
      if (node) render(<>{node}</>);
    }
  });
});
