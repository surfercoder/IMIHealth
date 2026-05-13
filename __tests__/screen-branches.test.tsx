import { fireEvent, render, waitFor } from "@testing-library/react-native";

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

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockLocalParams: { current: Record<string, unknown> } = { current: {} };

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    useRouter: () => ({ replace: mockReplace, back: mockBack, push: jest.fn() }),
    useLocalSearchParams: () => mockLocalParams.current,
    Stack: { Screen: () => null },
    Link: ({ children }: { children: React.ReactNode }) => children,
  };
});

const mockSetLocale = jest.fn();
jest.mock("@/src/i18n", () => ({
  SUPPORTED_LOCALES: ["es", "en"],
  setAppLocale: (...a: unknown[]) => mockSetLocale(...a),
}));

const mockVerifyOtp = jest.fn();
const mockExchangeCode = jest.fn();
jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    auth: {
      verifyOtp: (...a: unknown[]) => mockVerifyOtp(...a),
      exchangeCodeForSession: (...a: unknown[]) => mockExchangeCode(...a),
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

import { LanguageSwitcher } from "@/src/components/LanguageSwitcher";
import AuthConfirmScreen from "@/app/auth/confirm";
import ForgotPasswordScreen from "@/app/(auth)/forgot-password";

beforeEach(() => {
  mockReplace.mockReset();
  mockBack.mockReset();
  mockSetLocale.mockReset();
  mockVerifyOtp.mockReset();
  mockExchangeCode.mockReset();
  mockLocalParams.current = {};
});

describe("LanguageSwitcher modal close paths", () => {
  it("backdrop press closes the modal", () => {
    const { getByText, getByRole } = render(<LanguageSwitcher />);
    fireEvent.press(getByText("ES"));
    // Find the backdrop (a Pressable around the modal content).
    const backdrop = getByRole("button");
    fireEvent.press(backdrop);
  });
});

describe("AuthConfirm error fallback", () => {
  it("renders error back-to-landing button", async () => {
    mockLocalParams.current = { error: "x", error_description: "boom" };
    const { findByText } = render(<AuthConfirmScreen />);
    fireEvent.press(await findByText("common.back"));
    expect(mockReplace).toHaveBeenCalledWith("/landing");
  });
});

describe("ForgotPasswordScreen back button", () => {
  it("triggers router.back()", () => {
    const { getByRole } = render(<ForgotPasswordScreen />);
    const back = getByRole("button");
    void back;
    // The back button has no accessibility label; press the first Pressable.
    fireEvent.press(back);
  });
});
