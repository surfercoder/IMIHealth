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

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? k,
    i18n: { language: "es" },
  }),
}));

const mockAlert = jest.fn();
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  __esModule: true,
  default: { alert: (...a: unknown[]) => mockAlert(...a) },
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

// --- Signup screen dni branches ---

const mockSignUp = jest.fn();
jest.mock("@/src/lib/supabase", () => ({
  supabase: { auth: { signUp: (...a: unknown[]) => mockSignUp(...a) } },
}));

const mockSignupPro = jest.fn();
jest.mock("@/src/hooks/useCheckout", () => ({
  useCheckout: () => ({
    upgradeExisting: jest.fn(),
    signupPro: (...a: unknown[]) => mockSignupPro(...a),
  }),
}));

interface SignupFieldsProps {
  control: unknown;
}
jest.mock("@/src/components/signup/SignupFields", () => {
  const React = require("react");
  return {
    SignupFields: (_p: SignupFieldsProps) => React.createElement("view"),
  };
});

jest.mock("@/src/components/signup/PlanChip", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    PlanChip: (p: { label: string; active: boolean; onPress: () => void }) =>
      React.createElement(RN.Text, {
        testID: `chip-${p.label}`,
        onPress: p.onPress,
      }, p.label),
  };
});

type FormValues = Record<string, string>;
const submitValues: { current: FormValues } = {
  current: {
    name: "Dr Test",
    email: "test@example.com",
    dni: "12345678",
    matricula: "12345",
    phone: "+541112345678",
    especialidad: "Cardiología",
    tagline: "",
    avatar: "",
    firmaDigital: "",
    password: "Strong1!Pw",
    confirmPassword: "Strong1!Pw",
  },
};

jest.mock("react-hook-form", () => {
  const actual = jest.requireActual("react-hook-form");
  return {
    ...actual,
    useForm: () => ({
      ...actual.useForm({ defaultValues: {} }),
      handleSubmit: (cb: (v: FormValues) => void | Promise<void>) =>
        () => cb(submitValues.current),
      watch: () => "Dr Test",
      control: {},
    }),
    Controller: () => null,
  };
});

import SignupScreen from "@/app/(auth)/signup";

beforeEach(() => {
  mockBack.mockReset();
  mockReplace.mockReset();
  mockPush.mockReset();
  mockAlert.mockReset();
  mockSignUp.mockReset();
  mockSignupPro.mockReset();
  mockLocalParams.current = {};
  // Reset to default values
  submitValues.current = {
    name: "Dr Test",
    email: "test@example.com",
    dni: "12345678",
    matricula: "12345",
    phone: "+541112345678",
    especialidad: "Cardiología",
    tagline: "",
    avatar: "",
    firmaDigital: "",
    password: "Strong1!Pw",
    confirmPassword: "Strong1!Pw",
  };
});

describe("SignupScreen dni branches", () => {
  it("free plan with empty dni triggers `values.dni || null` fallback", async () => {
    submitValues.current = { ...submitValues.current, dni: "" };
    mockSignUp.mockResolvedValue({ error: null });
    const { getByText } = render(<SignupScreen />);
    fireEvent.press(getByText("signupForm.submit"));
    await waitFor(() => expect(mockSignUp).toHaveBeenCalled());
    expect(mockSignUp.mock.calls[0][0].options.data.dni).toBeNull();
  });

  it("pro plan with empty dni triggers `values.dni || undefined` fallback", async () => {
    submitValues.current = { ...submitValues.current, dni: "" };
    mockSignupPro.mockResolvedValue({ ok: true });
    const { findByTestId, getByText } = render(<SignupScreen />);
    fireEvent.press(await findByTestId("chip-Pro Monthly"));
    fireEvent.press(getByText("signupForm.submit"));
    await waitFor(() => expect(mockSignupPro).toHaveBeenCalled());
    expect(mockSignupPro.mock.calls[0][0].dni).toBeUndefined();
  });
});

// --- Billing/return MAX_POLLS + cancelled paths ---

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

describe("BillingReturn MAX_POLLS + cancelled paths", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockApiGet.mockReset();
    mockLocalParams.current = { ref: "r" };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("eventually settles into processing after MAX_POLLS attempts", async () => {
    mockApiGet.mockResolvedValue({ state: "processing" });
    render(<BillingReturnScreen />);
    // Drain pending timers until the polling stops (MAX_POLLS reached).
    await act(async () => {
      await jest.runAllTimersAsync();
    });
    await waitFor(() => expect(mockApiGet.mock.calls.length).toBeGreaterThanOrEqual(30));
  });

  it("ignores api result when component is unmounted mid-poll (cancelled path)", async () => {
    let resolve!: (v: { state: string }) => void;
    mockApiGet.mockImplementationOnce(
      () => new Promise((r) => { resolve = r; }),
    );
    const { unmount } = render(<BillingReturnScreen />);
    unmount();
    await act(async () => {
      resolve({ state: "ready" });
      await Promise.resolve();
    });
  });

  it("ignores api error when component is unmounted mid-poll", async () => {
    let reject!: (e: unknown) => void;
    mockApiGet.mockImplementationOnce(
      () => new Promise((_, rej) => { reject = rej; }),
    );
    const { unmount } = render(<BillingReturnScreen />);
    unmount();
    await act(async () => {
      reject(new Error("late"));
      await Promise.resolve();
    });
  });
});
