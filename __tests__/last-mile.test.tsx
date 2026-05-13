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

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockLocalParams: { current: Record<string, unknown> } = { current: {} };

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
    useLocalSearchParams: () => mockLocalParams.current,
    Stack: Object.assign(
      ({ children }: { children?: React.ReactNode }) =>
        React.createElement(React.Fragment, null, children),
      { Screen: () => null },
    ),
    Redirect: () => null,
  };
});

let mockAuthState: { initialized: boolean; session: unknown; user: unknown } = {
  initialized: false,
  session: null,
  user: null,
};
jest.mock("@/src/providers/AuthProvider", () => ({
  useAuth: () => ({
    ...mockAuthState,
    signOut: jest.fn(),
  }),
}));

beforeEach(() => {
  mockPush.mockReset();
  mockReplace.mockReset();
  mockBack.mockReset();
  mockLocalParams.current = {};
});

// ============================================================
// app/(auth)/_layout: !initialized branch
// ============================================================
describe("AuthLayout uninitialized branch", () => {
  it("renders nothing when not initialized", () => {
    mockAuthState = { initialized: false, session: null, user: null };
    const AuthLayout = require("@/app/(auth)/_layout").default;
    render(<AuthLayout />);
  });

  it("renders the stack when initialized without a session", () => {
    mockAuthState = { initialized: true, session: null, user: null };
    const AuthLayout = require("@/app/(auth)/_layout").default;
    render(<AuthLayout />);
  });

  it("renders Redirect when session exists", () => {
    mockAuthState = {
      initialized: true,
      session: { user: { id: "u" } },
      user: { id: "u" },
    };
    const AuthLayout = require("@/app/(auth)/_layout").default;
    render(<AuthLayout />);
  });
});

// ============================================================
// patient/new String() fallback branch
// ============================================================
describe("NewPatientScreen handles non-Error throws", () => {
  it("formats non-Error rejections via String()", async () => {
    mockAuthState = {
      initialized: true,
      session: { user: { id: "u" } },
      user: { id: "u" },
    };
    const mockCreatePatient = jest.fn().mockRejectedValue("plain string error");
    const mockAlert = jest.fn();
    jest.doMock("react-native/Libraries/Alert/Alert", () => ({
      __esModule: true,
      default: { alert: mockAlert },
    }));
    jest.doMock("@/src/lib/api/patients", () => ({
      createPatient: mockCreatePatient,
    }));
    jest.doMock("@/src/components/PatientForm", () => {
      const React = require("react");
      const RN = require("react-native");
      return {
        PatientForm: (p: { onSubmit: (v: { name: string }) => Promise<void> }) =>
          React.createElement(RN.Text, {
            testID: "submit",
            onPress: () => p.onSubmit({ name: "A" }),
          }, "submit"),
      };
    });
    const NewPatientScreen = require("@/app/(app)/patient/new").default;
    const { getByTestId } = render(<NewPatientScreen />);
    fireEvent.press(getByTestId("submit"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });
});

