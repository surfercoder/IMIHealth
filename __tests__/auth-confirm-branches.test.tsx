import { render, waitFor } from "@testing-library/react-native";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const mockReplace = jest.fn();
const mockLocalParams: { current: Record<string, unknown> } = { current: {} };
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => mockLocalParams.current,
}));

const mockVerifyOtp = jest.fn();
const mockExchangeCode = jest.fn();
jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    auth: {
      verifyOtp: (...a: unknown[]) => mockVerifyOtp(...a),
      exchangeCodeForSession: (...a: unknown[]) => mockExchangeCode(...a),
    },
  },
}));

import AuthConfirmScreen from "@/app/auth/confirm";

beforeEach(() => {
  mockReplace.mockReset();
  mockVerifyOtp.mockReset();
  mockExchangeCode.mockReset();
  mockLocalParams.current = {};
});

describe("AuthConfirm exhaustive branches", () => {
  it("uses error_description when set", async () => {
    mockLocalParams.current = { error: "err", error_description: "details" };
    const { findByText } = render(<AuthConfirmScreen />);
    await findByText("details");
  });

  it("falls back to error when no description", async () => {
    mockLocalParams.current = { error: "raw-error" };
    const { findByText } = render(<AuthConfirmScreen />);
    await findByText("raw-error");
  });

  it("surfaces verifyOtp errors", async () => {
    mockLocalParams.current = { token_hash: "t", type: "signup" };
    mockVerifyOtp.mockResolvedValue({ error: new Error("otp failed") });
    const { findByText } = render(<AuthConfirmScreen />);
    await findByText("otp failed");
  });

  it("surfaces exchangeCode errors", async () => {
    mockLocalParams.current = { code: "abc" };
    mockExchangeCode.mockResolvedValue({ error: new Error("exchange failed") });
    const { findByText } = render(<AuthConfirmScreen />);
    await findByText("exchange failed");
  });

  it("uses next parameter when provided", async () => {
    mockLocalParams.current = { token_hash: "t", type: "signup", next: "/dashboard" };
    mockVerifyOtp.mockResolvedValue({ error: null });
    render(<AuthConfirmScreen />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/dashboard"));
  });

  it("falls back to / when next is missing", async () => {
    mockLocalParams.current = { token_hash: "t", type: "signup" };
    mockVerifyOtp.mockResolvedValue({ error: null });
    render(<AuthConfirmScreen />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });

  it("handles non-Error throws via 'Unknown error'", async () => {
    mockLocalParams.current = { token_hash: "t", type: "signup" };
    // Throw a non-Error value from verifyOtp.
    mockVerifyOtp.mockImplementation(() => Promise.reject("plain string"));
    const { findByText } = render(<AuthConfirmScreen />);
    await findByText("Unknown error");
  });
});
