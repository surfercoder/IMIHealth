import { render } from "@testing-library/react-native";

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

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/src/components/LanguageSwitcher", () => ({
  LanguageSwitcher: () => null,
}));

jest.mock("@/src/hooks/useDoctor", () => ({
  useDoctor: () => ({ doctor: null, loading: false, setDoctor: jest.fn() }),
}));

import { AppHeader } from "@/src/components/AppHeader";

describe("AppHeader fallback paths", () => {
  it("renders without a doctor", () => {
    render(<AppHeader />);
  });
});
