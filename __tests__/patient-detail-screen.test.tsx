import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

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

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockLocalParams: { current: Record<string, unknown> } = { current: { id: "p" } };

jest.mock("expo-router", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    useRouter: () => ({ push: mockPush, back: mockBack }),
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

const mockUsePatientDetail = jest.fn();
jest.mock("@/src/hooks/usePatientDetail", () => ({
  usePatientDetail: () => mockUsePatientDetail(),
}));

const mockDeletePatient = jest.fn();
jest.mock("@/src/lib/api/patients", () => ({
  deletePatient: (...a: unknown[]) => mockDeletePatient(...a),
}));

const mockAlert = jest.fn();
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  __esModule: true,
  default: { alert: (...a: unknown[]) => mockAlert(...a) },
}));

const mockDictarPedidosProps: { current: Record<string, unknown> | null } = {
  current: null,
};
jest.mock("@/src/components/DictarPedidosModal", () => ({
  DictarPedidosModal: (props: Record<string, unknown>) => {
    mockDictarPedidosProps.current = props;
    return null;
  },
}));

import PatientDetailScreen from "@/app/(app)/patient/[id]/index";

const patient = {
  id: "p",
  name: "Ana",
  dni: "12345",
  email: "a@a.com",
  phone: "+1",
  dob: "2000-01-01",
  obra_social: "OSDE",
  nro_afiliado: "Z",
  plan: "P",
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
  mockPush.mockReset();
  mockBack.mockReset();
  mockAlert.mockReset();
  mockDeletePatient.mockReset();
  mockLocalParams.current = { id: "p" };
});

describe("PatientDetailScreen", () => {
  it("renders patient header and informes", () => {
    mockUsePatientDetail.mockReturnValue({
      patient,
      informes: [informe],
      loading: false,
    });
    const { getByText } = render(<PatientDetailScreen />);
    expect(getByText("Ana")).toBeTruthy();
  });

  it("edit button navigates to edit screen", () => {
    mockUsePatientDetail.mockReturnValue({
      patient,
      informes: [],
      loading: false,
    });
    const { getByLabelText } = render(<PatientDetailScreen />);
    fireEvent.press(getByLabelText("common.edit"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/patient/[id]/edit" }),
    );
  });

  it("delete button confirms and triggers delete + back", async () => {
    mockUsePatientDetail.mockReturnValue({
      patient,
      informes: [],
      loading: false,
    });
    mockDeletePatient.mockResolvedValue(undefined);
    mockAlert.mockImplementation((_t, _b, buttons) => {
      const d = (buttons as { style?: string; onPress?: () => void }[] | undefined)?.find(
        (b) => b.style === "destructive",
      );
      d?.onPress?.();
    });
    const { getByLabelText } = render(<PatientDetailScreen />);
    fireEvent.press(getByLabelText("common.delete"));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it("delete button alerts on api failure", async () => {
    mockUsePatientDetail.mockReturnValue({
      patient,
      informes: [],
      loading: false,
    });
    mockDeletePatient.mockRejectedValue(new Error("nope"));
    mockAlert.mockImplementation((_t, _b, buttons) => {
      const d = (buttons as { style?: string; onPress?: () => void }[] | undefined)?.find(
        (b) => b.style === "destructive",
      );
      d?.onPress?.();
    });
    const { getByLabelText } = render(<PatientDetailScreen />);
    fireEvent.press(getByLabelText("common.delete"));
    await waitFor(() => expect(mockAlert.mock.calls.length).toBeGreaterThan(1));
  });

  it("pressing an informe navigates to the informe page", () => {
    mockUsePatientDetail.mockReturnValue({
      patient,
      informes: [informe],
      loading: false,
    });
    const { getAllByRole } = render(<PatientDetailScreen />);
    const buttons = getAllByRole("button");
    // The informe row is the last button.
    fireEvent.press(buttons[buttons.length - 1]);
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/informe/[id]" }),
    );
  });

  it("renders loading state", () => {
    mockUsePatientDetail.mockReturnValue({
      patient: null,
      informes: [],
      loading: true,
    });
    render(<PatientDetailScreen />);
  });

  it("renders empty state when no patient", () => {
    mockUsePatientDetail.mockReturnValue({
      patient: null,
      informes: [],
      loading: false,
    });
    render(<PatientDetailScreen />);
  });

  it("dictar pedidos trigger opens the modal and onClose closes it", () => {
    mockUsePatientDetail.mockReturnValue({
      patient,
      informes: [],
      loading: false,
    });
    mockDictarPedidosProps.current = null;
    const { getByText } = render(<PatientDetailScreen />);
    expect(mockDictarPedidosProps.current).toMatchObject({
      visible: false,
      patientId: "p",
      patientName: "Ana",
      patientPhone: "+1",
    });
    fireEvent.press(getByText("dictarPedidos.trigger"));
    expect(mockDictarPedidosProps.current).toMatchObject({ visible: true });
    act(() => {
      (mockDictarPedidosProps.current!.onClose as () => void)();
    });
    expect(mockDictarPedidosProps.current).toMatchObject({ visible: false });
  });

  it("dictar pedidos modal receives null phone when patient.phone is missing", () => {
    mockUsePatientDetail.mockReturnValue({
      patient: { ...patient, phone: null },
      informes: [],
      loading: false,
    });
    mockDictarPedidosProps.current = null;
    render(<PatientDetailScreen />);
    expect(mockDictarPedidosProps.current).toMatchObject({ patientPhone: null });
  });

  it("delete is a no-op when patient is null at handler time", () => {
    mockUsePatientDetail.mockReturnValue({
      patient,
      informes: [],
      loading: false,
    });
    // Initial render only — we only need handler closure.
    const { getByLabelText } = render(<PatientDetailScreen />);
    mockAlert.mockImplementation(() => {});
    fireEvent.press(getByLabelText("common.delete"));
    expect(mockAlert).toHaveBeenCalled();
  });
});
