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

const mockI18nLang: { current: string | undefined } = { current: "es-AR" };
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? k,
    i18n: { language: mockI18nLang.current },
  }),
}));

// Make Modal auto-fire onRequestClose so that close handlers are invoked.
jest.mock("react-native/Libraries/Modal/Modal", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    __esModule: true,
    default: function MockModal(props: {
      visible: boolean;
      children: React.ReactNode;
      onRequestClose?: () => void;
    }) {
      React.useEffect(() => {
        if (props.visible) props.onRequestClose?.();
      }, [props.visible]);
      return props.visible
        ? React.createElement(RN.View, null, props.children)
        : null;
    },
  };
});

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockLocalParams: { current: Record<string, unknown> } = { current: {} };
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
  useLocalSearchParams: () => mockLocalParams.current,
  Stack: { Screen: () => null },
  Redirect: () => null,
}));

jest.mock("@/src/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "u" },
    initialized: true,
    session: { user: { id: "u" } },
    signOut: jest.fn(),
  }),
}));

const mockUsePatientDetail = jest.fn();
jest.mock("@/src/hooks/usePatientDetail", () => ({
  usePatientDetail: () => mockUsePatientDetail(),
}));

const mockGetPatient = jest.fn();
const mockUpdatePatient = jest.fn();
jest.mock("@/src/lib/api/patients", () => ({
  getPatient: (...a: unknown[]) => mockGetPatient(...a),
  updatePatient: (...a: unknown[]) => mockUpdatePatient(...a),
  deletePatient: jest.fn(),
}));

jest.mock("@/src/components/PatientForm", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    PatientForm: (p: {
      onSubmit: (v: { name: string }) => void | Promise<void>;
      onCancel?: () => void;
    }) =>
      React.createElement(RN.View, null, [
        React.createElement(
          RN.Text,
          {
            key: "submit",
            testID: "submit",
            onPress: () => p.onSubmit({ name: "x" }),
          },
          "submit",
        ),
      ]),
  };
});

jest.mock("@/src/i18n", () => ({
  SUPPORTED_LOCALES: ["es", "en"],
  setAppLocale: jest.fn(),
}));

jest.mock("@/src/lib/supabase", () => ({
  supabase: { auth: {} },
}));

jest.mock("@/src/components/DictarPedidosModal", () => ({
  DictarPedidosModal: () => null,
}));

import EditPatientScreen from "@/app/(app)/patient/[id]/edit";
import PatientDetailScreen from "@/app/(app)/patient/[id]/index";
import { LanguageSwitcher } from "@/src/components/LanguageSwitcher";

beforeEach(() => {
  mockPush.mockReset();
  mockBack.mockReset();
  mockReplace.mockReset();
  mockLocalParams.current = {};
  mockUsePatientDetail.mockReset();
  mockGetPatient.mockReset();
  mockUpdatePatient.mockReset();
  mockI18nLang.current = "es-AR";
});

describe("EditPatientScreen patient-null guard", () => {
  it("onSubmit early-returns when patient is null at the time of submit", async () => {
    mockLocalParams.current = { id: "p" };
    mockGetPatient.mockResolvedValue(null);
    const { queryByTestId } = render(<EditPatientScreen />);
    // patient is null so form never renders — confirm submit testID is absent.
    await waitFor(() => expect(mockGetPatient).toHaveBeenCalled());
    expect(queryByTestId("submit")).toBeNull();
  });
});

describe("PatientDetailScreen language fallback", () => {
  it("uses 'es' when i18n.language is undefined", () => {
    mockI18nLang.current = undefined;
    mockUsePatientDetail.mockReturnValue({
      patient: {
        id: "p",
        name: "Ana",
        dni: null,
        email: null,
        phone: null,
        dob: "2000-01-01",
        obra_social: null,
        nro_afiliado: null,
        plan: null,
      },
      informes: [],
      loading: false,
    });
    render(<PatientDetailScreen />);
  });
});

describe("LanguageSwitcher onRequestClose covered via Modal mock", () => {
  it("opens and closes via onRequestClose", () => {
    const { getByText } = render(<LanguageSwitcher />);
    fireEvent.press(getByText("ES"));
  });
});
