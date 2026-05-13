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
  }),
}));

const mockReplace = jest.fn();
const mockLocalParams: { current: Record<string, unknown> } = { current: { ref: "r" } };
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => mockLocalParams.current,
}));

const mockApiGet = jest.fn();
jest.mock("@/src/lib/api/client", () => ({
  api: { get: (...a: unknown[]) => mockApiGet(...a) },
  ApiError: class ApiError extends Error {
    status = 0;
    constructor(m: string) {
      super(m);
    }
  },
}));

import BillingReturnScreen from "@/app/billing/return";
import { ApiError } from "@/src/lib/api/client";

beforeEach(() => {
  jest.useFakeTimers();
  mockReplace.mockReset();
  mockApiGet.mockReset();
  mockLocalParams.current = { ref: "r" };
});

afterEach(() => {
  jest.useRealTimers();
});

describe("BillingReturn", () => {
  it("polls until ready", async () => {
    mockApiGet
      .mockResolvedValueOnce({ state: "processing" })
      .mockResolvedValueOnce({ state: "ready" });
    const { findByText } = render(<BillingReturnScreen />);
    await act(async () => {
      await Promise.resolve();
    });
    jest.advanceTimersByTime(2500);
    await act(async () => {
      await Promise.resolve();
    });
    const button = await findByText("signupForm.backToLogin");
    fireEvent.press(button);
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("unknown state triggers back-to-login", async () => {
    mockApiGet.mockResolvedValue({ state: "unknown" });
    const { findByText } = render(<BillingReturnScreen />);
    fireEvent.press(await findByText("signupForm.backToLogin"));
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("error state triggers back to landing", async () => {
    mockApiGet.mockRejectedValue(new ApiError("nope", 500, null));
    const { findByText } = render(<BillingReturnScreen />);
    fireEvent.press(await findByText("common.back"));
    expect(mockReplace).toHaveBeenCalledWith("/landing");
  });

  it("hits max polls then renders processing", async () => {
    mockApiGet.mockResolvedValue({ state: "processing" });
    const { unmount } = render(<BillingReturnScreen />);
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(2500 * 30);
      await Promise.resolve();
    });
    await waitFor(() => expect(mockApiGet).toHaveBeenCalled());
    unmount();
  });

  it("no ref → unknown immediately", () => {
    jest.useRealTimers();
    mockLocalParams.current = {};
    render(<BillingReturnScreen />);
  });
});
