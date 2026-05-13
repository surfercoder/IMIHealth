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

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "es" } }),
}));

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  Redirect: () => null,
}));

let mockAuthState = {
  initialized: false,
  session: null as unknown,
  user: null,
  signOut: jest.fn(),
};
jest.mock("@/src/providers/AuthProvider", () => ({
  useAuth: () => mockAuthState,
}));

jest.mock("@/src/hooks/useDoctor", () => ({
  useDoctor: () => ({ doctor: null, loading: false, setDoctor: jest.fn() }),
}));

jest.mock("@/src/lib/authTransitions", () => ({
  useAuthTransitions: () => ({ welcome: false, goodbye: false }),
  clearGoodbye: jest.fn(),
  clearWelcome: jest.fn(),
}));
jest.mock("@/src/components/WelcomeOverlay", () => ({ WelcomeOverlay: () => null }));
jest.mock("@/src/components/GoodbyeOverlay", () => ({ GoodbyeOverlay: () => null }));

import AppLayout from "@/app/(app)/_layout";

describe("AppLayout uninitialized branch", () => {
  it("returns null until auth provider initialises", () => {
    mockAuthState = {
      initialized: false,
      session: null,
      user: null,
      signOut: jest.fn(),
    };
    render(<AppLayout />);
  });
});
