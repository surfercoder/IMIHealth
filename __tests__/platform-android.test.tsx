/**
 * Re-renders screens with Platform.OS = 'android' to cover the ternary
 * `Platform.OS === "ios" ? "padding" : undefined` branches that the default
 * iOS-targeted test runner doesn't reach.
 */
import { Platform } from "react-native";

Object.defineProperty(Platform, "OS", {
  configurable: true,
  get: () => "android",
});

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
  useTranslation: () => ({
    t: (k: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? k,
    i18n: { language: "es" },
  }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: { Screen: () => null },
}));

jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      signUp: jest.fn(),
    },
  },
}));

jest.mock("@/src/hooks/useCheckout", () => ({
  useCheckout: () => ({ upgradeExisting: jest.fn(), signupPro: jest.fn() }),
}));

jest.mock("@/src/components/signup/PlanChip", () => ({ PlanChip: () => null }));
jest.mock("@/src/components/signup/SignupFields", () => ({ SignupFields: () => null }));

import LoginScreen from "@/app/(auth)/login";
import ForgotPasswordScreen from "@/app/(auth)/forgot-password";
import ResetPasswordScreen from "@/app/(auth)/reset-password";
import SignupScreen from "@/app/(auth)/signup";

describe("Auth screens render on Android (Platform.OS branch)", () => {
  it("LoginScreen renders without iOS padding", () => {
    render(<LoginScreen />);
  });

  it("ForgotPasswordScreen renders without iOS padding", () => {
    render(<ForgotPasswordScreen />);
  });

  it("ResetPasswordScreen renders without iOS padding", () => {
    render(<ResetPasswordScreen />);
  });

  it("SignupScreen renders without iOS padding (both views)", () => {
    render(<SignupScreen />);
  });
});
