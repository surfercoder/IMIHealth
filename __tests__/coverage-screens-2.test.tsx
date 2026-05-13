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

const mockAlert = jest.fn();
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  __esModule: true,
  default: { alert: (...a: unknown[]) => mockAlert(...a) },
}));

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockLocalParams: { current: Record<string, unknown> } = { current: {} };

jest.mock("expo-router", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    useRouter: () => ({ back: mockBack, push: mockPush, replace: mockReplace }),
    useLocalSearchParams: () => mockLocalParams.current,
    Stack: Object.assign(
      ({ children }: { children?: React.ReactNode }) => children ?? null,
      {
        Screen: (props: { options?: { headerRight?: () => React.ReactNode } }) => {
          if (props.options?.headerRight) {
            return React.createElement(
              RN.View,
              { testID: "header-right" },
              props.options.headerRight(),
            );
          }
          return null;
        },
      },
    ),
  };
});

// Patient detail mocks
const mockUsePatientDetail = jest.fn();
jest.mock("@/src/hooks/usePatientDetail", () => ({
  usePatientDetail: () => mockUsePatientDetail(),
}));

const mockDeletePatient = jest.fn();
jest.mock("@/src/lib/api/patients", () => ({
  deletePatient: (...a: unknown[]) => mockDeletePatient(...a),
  getPatient: jest.fn(),
  updatePatient: jest.fn(),
  createPatient: jest.fn(),
}));

// Patients tab mocks
const mockUsePatients = jest.fn();
jest.mock("@/src/hooks/usePatients", () => ({
  usePatients: () => mockUsePatients(),
}));

jest.mock("@/src/components/AppHeader", () => ({ AppHeader: () => null }));
jest.mock("@/src/components/DictarPedidosModal", () => ({
  DictarPedidosModal: () => null,
}));

import PatientDetailScreen from "@/app/(app)/patient/[id]/index";
import PatientsTab from "@/app/(app)/(tabs)/patients";

const patient = {
  id: "p",
  name: "Ana",
  dni: "12345",
  email: "a@a.com",
  phone: "+1",
  dob: null,
  obra_social: null,
  nro_afiliado: null,
  plan: null,
};

const informe = {
  id: "i",
  doctor_id: "u",
  patient_id: "p",
  status: "completed" as const,
  informe_doctor: "",
  informe_paciente: "",
  recording_duration: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

beforeEach(() => {
  mockBack.mockReset();
  mockPush.mockReset();
  mockReplace.mockReset();
  mockAlert.mockReset();
  mockDeletePatient.mockReset();
  mockUsePatientDetail.mockReset();
  mockUsePatients.mockReset();
  mockLocalParams.current = { id: "p" };
  mockI18nLanguage.current = "es";
});

describe("PatientDetailScreen separator + non-Error throw", () => {
  it("renders the FlatList separator between two informes", () => {
    mockUsePatientDetail.mockReturnValue({
      patient,
      informes: [informe, { ...informe, id: "i2" }],
      loading: false,
    });
    render(<PatientDetailScreen />);
  });

  it("stringifies non-Error rejections from deletePatient", async () => {
    mockUsePatientDetail.mockReturnValue({
      patient,
      informes: [],
      loading: false,
    });
    mockDeletePatient.mockRejectedValue("string-error");
    mockAlert.mockImplementation((_t, _b, buttons) => {
      const d = (buttons as { style?: string; onPress?: () => void }[] | undefined)?.find(
        (b) => b.style === "destructive",
      );
      d?.onPress?.();
    });
    const { getByLabelText } = render(<PatientDetailScreen />);
    fireEvent.press(getByLabelText("common.delete"));
    await waitFor(() => expect(mockAlert.mock.calls.length).toBeGreaterThan(1));
    // Second alert is the error toast.
    expect(mockAlert.mock.calls[1][1]).toBe("string-error");
  });
});

describe("PatientsTab separator", () => {
  it("renders the FlatList separator between two patients", () => {
    mockUsePatients.mockReturnValue({
      patients: [
        { id: "a", name: "A", dni: null, phone: null, email: null, dob: null, obra_social: null, nro_afiliado: null, plan: null, created_at: "2024-01-01", informe_count: 0, last_informe_at: null, last_informe_status: null },
        { id: "b", name: "B", dni: null, phone: null, email: null, dob: null, obra_social: null, nro_afiliado: null, plan: null, created_at: "2024-01-01", informe_count: 0, last_informe_at: null, last_informe_status: null },
      ],
      loading: false,
      refreshing: false,
      refresh: jest.fn(),
    });
    render(<PatientsTab />);
  });

  it("filter callback runs when query is non-empty", () => {
    mockUsePatients.mockReturnValue({
      patients: [
        { id: "a", name: "Alpha", dni: "1", phone: "+5", email: null, dob: null, obra_social: null, nro_afiliado: null, plan: null, created_at: "2024-01-01", informe_count: 0, last_informe_at: null, last_informe_status: null },
        { id: "b", name: "Beta", dni: null, phone: null, email: null, dob: null, obra_social: null, nro_afiliado: null, plan: null, created_at: "2024-01-01", informe_count: 0, last_informe_at: null, last_informe_status: null },
      ],
      loading: false,
      refreshing: false,
      refresh: jest.fn(),
    });
    const { getByPlaceholderText } = render(<PatientsTab />);
    fireEvent.changeText(getByPlaceholderText("patientsList.searchPlaceholder"), "alp");
  });
});
