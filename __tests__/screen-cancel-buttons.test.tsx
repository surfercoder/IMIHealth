import { fireEvent, render } from "@testing-library/react-native";

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

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockLocalParams: { current: Record<string, unknown> } = { current: { id: "p" } };

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush, replace: mockReplace }),
  useLocalSearchParams: () => mockLocalParams.current,
  Stack: { Screen: () => null },
}));

const mockGetPatient = jest.fn();
jest.mock("@/src/lib/api/patients", () => ({
  getPatient: (...a: unknown[]) => mockGetPatient(...a),
  updatePatient: jest.fn(),
}));

jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: jest.fn(),
      signUp: jest.fn(),
    },
  },
}));

jest.mock("@/src/hooks/useCheckout", () => ({
  useCheckout: () => ({ upgradeExisting: jest.fn(), signupPro: jest.fn() }),
}));

jest.mock("@/src/components/signup/PlanChip", () => ({
  PlanChip: () => null,
}));
jest.mock("@/src/components/signup/SignupFields", () => ({
  SignupFields: () => null,
}));

jest.mock("@/src/components/PatientForm", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    PatientForm: (p: { onCancel?: () => void }) =>
      React.createElement(RN.Text, {
        testID: "cancel",
        onPress: () => p.onCancel?.(),
      }, "cancel"),
  };
});

import EditPatientScreen from "@/app/(app)/patient/[id]/edit";
import ForgotPasswordScreen from "@/app/(auth)/forgot-password";
import SignupScreen from "@/app/(auth)/signup";

beforeEach(() => {
  mockBack.mockReset();
  mockPush.mockReset();
  mockReplace.mockReset();
  mockGetPatient.mockReset();
});

describe("Back/cancel button onPress branches", () => {
  it("EditPatientScreen cancel calls router.back()", async () => {
    mockLocalParams.current = { id: "p" };
    mockGetPatient.mockResolvedValue({
      id: "p",
      name: "A",
      dni: null,
      dob: null,
      phone: null,
      email: null,
      obra_social: null,
      nro_afiliado: null,
      plan: null,
    });
    const { findByTestId } = render(<EditPatientScreen />);
    fireEvent.press(await findByTestId("cancel"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("ForgotPasswordScreen back Pressable triggers router.back()", () => {
    const { root } = render(<ForgotPasswordScreen />);
    // Find the first descendant whose props include a back() onPress.
    const stack: { children?: unknown; props?: { onPress?: () => void } }[] = [root];
    while (stack.length) {
      const node = stack.shift();
      if (!node || typeof node !== "object") continue;
      if (typeof (node as { props?: { onPress?: () => void } }).props?.onPress === "function") {
        (node as { props: { onPress: () => void } }).props.onPress();
        break;
      }
      const children = (node as { children?: unknown[] }).children;
      if (Array.isArray(children)) stack.push(...(children as never[]));
    }
    expect(mockBack).toHaveBeenCalled();
  });

  it("SignupScreen back Pressable triggers router.back()", () => {
    const { root } = render(<SignupScreen />);
    const stack: { children?: unknown; props?: { onPress?: () => void } }[] = [root];
    while (stack.length) {
      const node = stack.shift();
      if (!node || typeof node !== "object") continue;
      if (typeof (node as { props?: { onPress?: () => void } }).props?.onPress === "function") {
        (node as { props: { onPress: () => void } }).props.onPress();
        break;
      }
      const children = (node as { children?: unknown[] }).children;
      if (Array.isArray(children)) stack.push(...(children as never[]));
    }
    expect(mockBack).toHaveBeenCalled();
  });
});
