import { render } from "@testing-library/react-native";

jest.mock("react-native-gifted-charts", () => ({
  LineChart: () => null,
  BarChart: () => null,
  PieChart: () => null,
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { DashboardCharts } from "@/src/components/dashboard-charts";
import { PatientsOverTimeChart } from "@/src/components/dashboard-charts/PatientsOverTimeChart";
import { ConsultationTimeChart } from "@/src/components/dashboard-charts/ConsultationTimeChart";
import { PatientsAccumulatorChart } from "@/src/components/dashboard-charts/PatientsAccumulatorChart";
import { InformTypesChart } from "@/src/components/dashboard-charts/InformTypesChart";
import { formatDateLabel } from "@/src/components/dashboard-charts/helpers";

describe("formatDateLabel", () => {
  it("formats a valid date", () => {
    const out = formatDateLabel("2024-03-15T00:00:00Z");
    expect(out).toMatch(/\d+\s+\w+/);
  });

  it("returns input for invalid date", () => {
    expect(formatDateLabel("nope")).toBe("nope");
  });
});

describe("PatientsOverTimeChart", () => {
  it("renders empty state", () => {
    const { getByText } = render(<PatientsOverTimeChart data={[]} />);
    expect(getByText("charts.noData")).toBeTruthy();
  });

  it("renders chart with data", () => {
    render(
      <PatientsOverTimeChart
        data={Array.from({ length: 12 }, (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
          total: i + 1,
        }))}
      />,
    );
  });
});

describe("ConsultationTimeChart", () => {
  it("renders empty state", () => {
    render(
      <ConsultationTimeChart
        data={{ avg: 0, min: 0, max: 0, data: [] }}
      />,
    );
  });

  it("renders with data", () => {
    render(
      <ConsultationTimeChart
        data={{
          avg: 12.3,
          min: 1.2,
          max: 30.5,
          data: [
            { date: "2024-01-01", minutes: 5.5 },
            { date: "2024-01-02", minutes: 7.7 },
          ],
        }}
      />,
    );
  });
});

describe("PatientsAccumulatorChart", () => {
  it("renders empty state", () => {
    render(<PatientsAccumulatorChart data={{ current: [], average: 0 }} />);
  });

  it("renders with data", () => {
    render(
      <PatientsAccumulatorChart
        data={{
          current: [
            { date: "2024-01-01", patients: 3 },
            { date: "2024-01-02", patients: 5 },
          ],
          average: 4,
        }}
      />,
    );
  });
});

describe("InformTypesChart", () => {
  it("renders zero state", () => {
    render(
      <InformTypesChart
        data={[
          { type: "classic", count: 0 },
          { type: "quick", count: 0 },
        ]}
      />,
    );
  });

  it("renders with counts", () => {
    render(
      <InformTypesChart
        data={[
          { type: "classic", count: 4 },
          { type: "quick", count: 6 },
        ]}
      />,
    );
  });
});

describe("DashboardCharts wrapper", () => {
  it("renders all four charts", () => {
    render(
      <DashboardCharts
        data={{
          patientsOverTime: [],
          consultationTime: { avg: 0, min: 0, max: 0, data: [] },
          patientsAccumulator: { current: [], average: 0 },
          informTypes: [
            { type: "classic", count: 0 },
            { type: "quick", count: 0 },
          ],
        }}
      />,
    );
  });
});
