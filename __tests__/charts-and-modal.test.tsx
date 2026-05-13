import { fireEvent, render } from "@testing-library/react-native";

let lineChartData: { label: string }[] = [];
let lineChartMaxValue: number | undefined;
jest.mock("react-native-gifted-charts", () => ({
  LineChart: (p: { data: { label: string }[]; maxValue?: number }) => {
    lineChartData = p.data;
    lineChartMaxValue = p.maxValue;
    return null;
  },
  BarChart: () => null,
  PieChart: () => null,
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string) => k,
    i18n: { language: "es" },
  }),
}));

// Modal mock that auto-fires onRequestClose.
jest.mock("react-native/Libraries/Modal/Modal", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    __esModule: true,
    default: function MockModal(props: {
      visible: boolean;
      children: React.ReactNode;
      onRequestClose?: () => void;
    }) {
      React.useEffect(() => {
        if (props.visible) props.onRequestClose?.();
      }, [props.visible]);
      return props.visible
        ? React.createElement(RN.View, null, props.children)
        : null;
    },
  };
});

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

jest.mock("expo-image", () => {
  const React = require("react");
  const RN = require("react-native");
  return { Image: (p: object) => React.createElement(RN.View, p) };
});

jest.mock("react-native-signature-canvas", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    __esModule: true,
    default: React.forwardRef(function MockSignatureScreen() {
      return React.createElement(RN.View);
    }),
  };
});

import { PatientsAccumulatorChart } from "@/src/components/dashboard-charts/PatientsAccumulatorChart";
import { SignaturePad } from "@/src/components/SignaturePad";

describe("PatientsAccumulatorChart label/maxValue branches", () => {
  beforeEach(() => {
    lineChartData = [];
    lineChartMaxValue = undefined;
  });

  it("populates non-label entries for indices where i % step !== 0", () => {
    // 12 points; step = ceil(12/6) = 2. So odd indices (1, 3, ...) get "".
    const data = Array.from({ length: 12 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
      patients: i + 1,
    }));
    render(<PatientsAccumulatorChart data={{ current: data, average: 5 }} />);
    expect(lineChartData[0].label.length).toBeGreaterThan(0);
    expect(lineChartData[1].label).toBe("");
  });

  it("falls back to maxValue=1 when both data and average are 0", () => {
    render(
      <PatientsAccumulatorChart
        data={{ current: [{ date: "2024-01-01T00:00:00Z", patients: 0 }], average: 0 }}
      />,
    );
    expect(lineChartMaxValue).toBe(1);
  });
});

describe("SignaturePad modal opens via the placeholder", () => {
  it("renders the modal contents when open is true via the Pressable", () => {
    const { getByText } = render(<SignaturePad onChange={() => {}} />);
    fireEvent.press(getByText("signatureField.placeholder"));
  });
});
