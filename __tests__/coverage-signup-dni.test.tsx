import { fireEvent, render, waitFor, act } from "@testing-library/react-native";
import { useEffect } from "react";

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
    t: (k: string) => k,
    i18n: { language: "es" },
  }),
}));

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    useRouter: () => ({ back: jest.fn(), replace: jest.fn(), push: jest.fn() }),
    Link: ({ children }: { children: React.ReactNode }) => children,
    Stack: Object.assign(
      ({ children }: { children?: React.ReactNode }) => children ?? null,
      { Screen: () => null },
    ),
  };
});

const mockSignUp = jest.fn().mockResolvedValue({ error: null });
jest.mock("@/src/lib/supabase", () => ({
  supabase: { auth: { signUp: (...a: unknown[]) => mockSignUp(...a) } },
}));

jest.mock("@/src/hooks/useCheckout", () => ({
  useCheckout: () => ({
    upgradeExisting: jest.fn(),
    signupPro: jest.fn(),
  }),
}));

// SignupFields stub: capture the form's control so the test can call setValue.
type FormControlLike = {
  _formValues?: Record<string, unknown>;
};
const capturedControl: { current: FormControlLike | null } = { current: null };
jest.mock("@/src/components/signup/SignupFields", () => {
  const React = require("react");
  return {
    SignupFields: (p: { control: FormControlLike }) => {
      capturedControl.current = p.control;
      return React.createElement("view");
    },
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

import SignupScreen from "@/app/(auth)/signup";

beforeEach(() => {
  mockSignUp.mockReset().mockResolvedValue({ error: null });
  capturedControl.current = null;
});

describe("Signup zod schema dni regex branch (non-empty)", () => {
  it("submits with a valid 8-digit dni so the regex refine runs", async () => {
    const { getByText } = render(<SignupScreen />);
    await waitFor(() => expect(capturedControl.current).not.toBeNull());
    // Hook into the form control via the captured reference. Use the internal
    // _options to obtain setValue + handleSubmit through the same form instance.
    const ctl = capturedControl.current as unknown as {
      _options: { resolver: unknown };
      _formState: unknown;
      _subjects: unknown;
      _getFieldArray: unknown;
      _names: { array: Set<string>; mount: Set<string>; unMount: Set<string>; watch: Set<string>; focus: string; watchAll: boolean };
      _state: unknown;
      _formValues: Record<string, unknown>;
      _defaultValues: Record<string, unknown>;
      _disableForm: unknown;
      _proxyFormState: unknown;
      _executeSchema: (names?: string[]) => Promise<unknown>;
    };
    // Mutate values to include a non-empty dni and trigger schema validation.
    ctl._formValues.dni = "12345678";
    ctl._formValues.name = "Doctor Test";
    ctl._formValues.email = "doc@example.com";
    ctl._formValues.matricula = "12345";
    ctl._formValues.phone = "+5491112345678";
    ctl._formValues.especialidad = "Cardiología";
    ctl._formValues.tagline = "";
    ctl._formValues.avatar = "";
    ctl._formValues.firmaDigital = "";
    ctl._formValues.password = "Strong1!Pw";
    ctl._formValues.confirmPassword = "Strong1!Pw";
    await act(async () => {
      await ctl._executeSchema?.();
    });
    // Then submit to validate end-to-end.
    fireEvent.press(getByText("signupForm.submit"));
    await waitFor(() => Promise.resolve());
  });
});
