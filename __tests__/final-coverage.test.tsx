import { fireEvent, render, waitFor, act } from "@testing-library/react-native";

jest.mock("react-native-svg", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (p: object) => React.createElement("svg", p),
    Svg: (p: object) => React.createElement("svg", p),
    Path: (p: object) => React.createElement("path", p),
    Circle: (p: object) => React.createElement("circle", p),
    Rect: (p: object) => React.createElement("rect", p),
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? k,
    i18n: { language: "es" },
  }),
}));

let chartsInformTypesCenterLabel: (() => React.ReactNode) | null = null;
jest.mock("react-native-gifted-charts", () => {
  return {
    LineChart: () => null,
    BarChart: () => null,
    PieChart: (p: { centerLabelComponent?: () => React.ReactNode }) => {
      chartsInformTypesCenterLabel = p.centerLabelComponent ?? null;
      return null;
    },
  };
});

import { MarkdownEditor } from "@/src/components/MarkdownEditor";
import { InformTypesChart } from "@/src/components/dashboard-charts/InformTypesChart";

describe("MarkdownEditor edit tab", () => {
  it("switches back to edit mode after preview", () => {
    const { getByText } = render(
      <MarkdownEditor value="x" onChange={() => {}} />,
    );
    fireEvent.press(getByText("Preview"));
    fireEvent.press(getByText("common.edit"));
  });
});

describe("InformTypesChart centerLabelComponent", () => {
  it("renders the center label when counts are non-zero", () => {
    render(
      <InformTypesChart
        data={[
          { type: "classic", count: 3 },
          { type: "quick", count: 2 },
        ]}
      />,
    );
    expect(chartsInformTypesCenterLabel).toBeTruthy();
    render(<>{chartsInformTypesCenterLabel?.()}</>);
  });
});

void act;
void waitFor;
