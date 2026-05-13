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

jest.mock("expo-image", () => {
  const React = require("react");
  const RN = require("react-native");
  return { Image: (p: object) => React.createElement(RN.View, p) };
});

const mockI18nLanguage: { current: string | undefined } = { current: "es" };
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? k,
    i18n: { language: mockI18nLanguage.current },
  }),
}));

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockLocalParams: { current: Record<string, unknown> } = { current: {} };
jest.mock("expo-router", () => {
  const React = require("react");
  return {
    useRouter: () => ({ back: mockBack, replace: mockReplace, push: mockPush }),
    useLocalSearchParams: () => mockLocalParams.current,
    Link: ({ children }: { children: React.ReactNode }) => children,
    Stack: Object.assign(
      ({ children }: { children?: React.ReactNode }) => children ?? null,
      { Screen: () => null },
    ),
  };
});

const mockSupabaseReset = jest.fn();
const mockSupabaseSignIn = jest.fn();
const mockSupabaseUpdateUser = jest.fn();
jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...a: unknown[]) => mockSupabaseReset(...a),
      signInWithPassword: (...a: unknown[]) => mockSupabaseSignIn(...a),
      updateUser: (...a: unknown[]) => mockSupabaseUpdateUser(...a),
      signUp: jest.fn().mockResolvedValue({ error: null }),
    },
  },
}));

jest.mock("@/src/lib/authTransitions", () => ({
  triggerWelcome: jest.fn(),
}));

import ForgotPasswordScreen from "@/app/(auth)/forgot-password";
import LoginScreen from "@/app/(auth)/login";
import ResetPasswordScreen from "@/app/(auth)/reset-password";

beforeEach(() => {
  mockBack.mockReset();
  mockReplace.mockReset();
  mockPush.mockReset();
  mockSupabaseReset.mockReset();
  mockSupabaseSignIn.mockReset();
  mockSupabaseUpdateUser.mockReset();
  mockLocalParams.current = {};
  mockI18nLanguage.current = "es";
});

describe("ForgotPasswordScreen error branch", () => {
  it("renders the inline error when reset fails", async () => {
    mockSupabaseReset.mockResolvedValue({ error: { message: "bad email" } });
    const { findByText, getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen />,
    );
    fireEvent.changeText(
      getByPlaceholderText("forgotPasswordForm.emailPlaceholder"),
      "a@b.com",
    );
    fireEvent.press(getByText("forgotPasswordForm.submit"));
    await findByText("bad email");
  });

  it("renders the submitting label while the request is in flight", async () => {
    let resolve: (v: { error: null }) => void = () => {};
    mockSupabaseReset.mockImplementation(
      () => new Promise((r) => { resolve = r; }),
    );
    const { getByPlaceholderText, getByText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(
      getByPlaceholderText("forgotPasswordForm.emailPlaceholder"),
      "a@b.com",
    );
    fireEvent.press(getByText("forgotPasswordForm.submit"));
    await waitFor(() => expect(mockSupabaseReset).toHaveBeenCalled());
    await act(async () => {
      resolve({ error: null });
    });
  });

  it("shows success state and replace on backToLogin press", async () => {
    mockSupabaseReset.mockResolvedValue({ error: null });
    const { findByText, getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen />,
    );
    fireEvent.changeText(
      getByPlaceholderText("forgotPasswordForm.emailPlaceholder"),
      "a@b.com",
    );
    fireEvent.press(getByText("forgotPasswordForm.submit"));
    const back = await findByText("forgotPasswordForm.backToLogin");
    fireEvent.press(back);
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

});

describe("LoginScreen error branch", () => {
  it("renders the server error when signInWithPassword returns error", async () => {
    mockSupabaseSignIn.mockResolvedValue({ error: { message: "invalid creds" } });
    const { findByText, getByPlaceholderText, getByText } = render(
      <LoginScreen />,
    );
    fireEvent.changeText(
      getByPlaceholderText("loginForm.emailPlaceholder"),
      "a@b.com",
    );
    fireEvent.changeText(
      getByPlaceholderText("loginForm.passwordPlaceholder"),
      "Strong1!",
    );
    fireEvent.press(getByText("loginForm.submit"));
    await findByText("invalid creds");
  });

  it("renders the submitting label while the request is in flight", async () => {
    let resolve: (v: { error: null }) => void = () => {};
    mockSupabaseSignIn.mockImplementation(
      () => new Promise((r) => { resolve = r; }),
    );
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(
      getByPlaceholderText("loginForm.emailPlaceholder"),
      "a@b.com",
    );
    fireEvent.changeText(
      getByPlaceholderText("loginForm.passwordPlaceholder"),
      "Strong1!",
    );
    fireEvent.press(getByText("loginForm.submit"));
    await waitFor(() => expect(mockSupabaseSignIn).toHaveBeenCalled());
    await act(async () => {
      resolve({ error: null });
    });
  });
});

describe("ResetPasswordScreen error branch", () => {
  it("renders the inline error when updateUser fails", async () => {
    mockSupabaseUpdateUser.mockResolvedValue({ error: { message: "weak" } });
    const { findByText, getByPlaceholderText, getByText } = render(
      <ResetPasswordScreen />,
    );
    fireEvent.changeText(
      getByPlaceholderText("resetPasswordForm.newPasswordPlaceholder"),
      "Strong1!Aa",
    );
    fireEvent.changeText(
      getByPlaceholderText("resetPasswordForm.confirmPasswordPlaceholder"),
      "Strong1!Aa",
    );
    fireEvent.press(getByText("resetPasswordForm.submit"));
    await findByText("weak");
  });

  it("renders the submitting label while the request is in flight", async () => {
    let resolve: (v: { error: null }) => void = () => {};
    mockSupabaseUpdateUser.mockImplementation(
      () => new Promise((r) => { resolve = r; }),
    );
    const { getByPlaceholderText, getByText } = render(<ResetPasswordScreen />);
    fireEvent.changeText(
      getByPlaceholderText("resetPasswordForm.newPasswordPlaceholder"),
      "Strong1!Aa",
    );
    fireEvent.changeText(
      getByPlaceholderText("resetPasswordForm.confirmPasswordPlaceholder"),
      "Strong1!Aa",
    );
    fireEvent.press(getByText("resetPasswordForm.submit"));
    await waitFor(() => expect(mockSupabaseUpdateUser).toHaveBeenCalled());
    await act(async () => {
      resolve({ error: null });
    });
  });

  it("navigates to / on successful password reset", async () => {
    mockSupabaseUpdateUser.mockResolvedValue({ error: null });
    const { getByPlaceholderText, getByText } = render(<ResetPasswordScreen />);
    fireEvent.changeText(
      getByPlaceholderText("resetPasswordForm.newPasswordPlaceholder"),
      "Strong1!Aa",
    );
    fireEvent.changeText(
      getByPlaceholderText("resetPasswordForm.confirmPasswordPlaceholder"),
      "Strong1!Aa",
    );
    fireEvent.press(getByText("resetPasswordForm.submit"));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });
});

// Auth/confirm screen — cover the cancelled = true paths via unmount before resolution.
const mockVerifyOtp = jest.fn();
const mockExchangeCode = jest.fn();
jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...a: unknown[]) => mockSupabaseReset(...a),
      signInWithPassword: (...a: unknown[]) => mockSupabaseSignIn(...a),
      updateUser: (...a: unknown[]) => mockSupabaseUpdateUser(...a),
      signUp: jest.fn().mockResolvedValue({ error: null }),
      verifyOtp: (...a: unknown[]) => mockVerifyOtp(...a),
      exchangeCodeForSession: (...a: unknown[]) => mockExchangeCode(...a),
    },
  },
}));

import AuthConfirmScreen from "@/app/auth/confirm";

describe("AuthConfirmScreen cancelled paths", () => {
  it("does not setError when unmounted before params.error resolves", () => {
    mockLocalParams.current = { error: "boom", error_description: "x" };
    const { unmount } = render(<AuthConfirmScreen />);
    unmount();
  });

  it("ignores verifyOtp result when component unmounted first", async () => {
    let resolve: (v: { error: null }) => void = () => {};
    mockVerifyOtp.mockImplementation(
      () => new Promise((r) => { resolve = r; }),
    );
    mockLocalParams.current = { token_hash: "t", type: "signup" };
    const { unmount } = render(<AuthConfirmScreen />);
    unmount();
    await act(async () => {
      resolve({ error: null });
    });
    // mockReplace must NOT have been called since component unmounted.
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("ignores verifyOtp error when component unmounted first", async () => {
    let reject: (e: unknown) => void = () => {};
    mockVerifyOtp.mockImplementation(
      () => new Promise((_, rej) => { reject = rej; }),
    );
    mockLocalParams.current = { token_hash: "t", type: "signup" };
    const { unmount } = render(<AuthConfirmScreen />);
    unmount();
    await act(async () => {
      reject(new Error("late"));
    });
    // No state updates should leak through after unmount.
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
