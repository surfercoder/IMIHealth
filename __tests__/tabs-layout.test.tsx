import { render } from "@testing-library/react-native";

interface TabsScreenOptions {
  tabBarIcon?: (info: { color: string; size: number }) => React.ReactNode;
}

const capturedScreens: { options?: TabsScreenOptions }[] = [];

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    Tabs: Object.assign(
      ({ children }: { children?: React.ReactNode }) =>
        React.createElement(React.Fragment, null, children),
      {
        Screen: (props: { options?: TabsScreenOptions }) => {
          capturedScreens.push(props);
          return null;
        },
      },
    ),
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

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import TabsLayout from "@/app/(app)/(tabs)/_layout";

describe("TabsLayout tabBarIcon", () => {
  it("invokes each tabBarIcon function", () => {
    capturedScreens.length = 0;
    render(<TabsLayout />);
    expect(capturedScreens.length).toBe(3);
    for (const screen of capturedScreens) {
      const node = screen.options?.tabBarIcon?.({ color: "#000", size: 24 });
      if (node) render(<>{node}</>);
    }
  });
});
