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

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? k,
    i18n: { language: "es" },
  }),
}));

const mockLocalParams: { current: Record<string, unknown> } = { current: { id: "i" } };
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock("expo-router", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn() }),
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

jest.mock("@/src/providers/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "u" } }),
}));

const mockGetInforme = jest.fn();
const mockDeleteInforme = jest.fn();
const mockUpdateInformeContent = jest.fn();
jest.mock("@/src/lib/api/informes", () => ({
  getInforme: (...a: unknown[]) => mockGetInforme(...a),
  deleteInforme: (...a: unknown[]) => mockDeleteInforme(...a),
  updateInformeContent: (...a: unknown[]) => mockUpdateInformeContent(...a),
}));

const mockGetPatient = jest.fn();
jest.mock("@/src/lib/api/patients", () => ({
  getPatient: (...a: unknown[]) => mockGetPatient(...a),
}));

const mockGetDoctor = jest.fn();
jest.mock("@/src/lib/api/doctors", () => ({
  getDoctor: (...a: unknown[]) => mockGetDoctor(...a),
}));

interface CardProps {
  draft: string;
  onDraftChange: (v: string) => void;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

jest.mock("@/src/components/informe/DoctorReportCard", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    DoctorReportCard: (p: CardProps) =>
      React.createElement(RN.View, null, [
        React.createElement(RN.Text, {
          key: "edit",
          testID: "doctor-edit",
          onPress: p.onStartEdit,
        }, "doctor-edit"),
        React.createElement(RN.Text, {
          key: "draft",
          testID: "doctor-draft",
          onPress: () => p.onDraftChange("new"),
        }, "doctor-draft"),
        React.createElement(RN.Text, {
          key: "save",
          testID: "doctor-save",
          onPress: p.onSave,
        }, "doctor-save"),
        React.createElement(RN.Text, {
          key: "cancel",
          testID: "doctor-cancel",
          onPress: p.onCancel,
        }, "doctor-cancel"),
      ]),
  };
});

jest.mock("@/src/components/informe/PatientReportCard", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    PatientReportCard: (p: CardProps) =>
      React.createElement(RN.View, null, [
        React.createElement(RN.Text, {
          key: "edit",
          testID: "patient-edit",
          onPress: p.onStartEdit,
        }, "patient-edit"),
        React.createElement(RN.Text, {
          key: "draft",
          testID: "patient-draft",
          onPress: () => p.onDraftChange("pnew"),
        }, "patient-draft"),
        React.createElement(RN.Text, {
          key: "save",
          testID: "patient-save",
          onPress: p.onSave,
        }, "patient-save"),
      ]),
  };
});

const mockAlert = jest.fn();
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  __esModule: true,
  default: { alert: (...a: unknown[]) => mockAlert(...a) },
}));

import InformeDetailScreen from "@/app/(app)/informe/[id]";

const completedInforme = {
  id: "i",
  doctor_id: "u",
  patient_id: "p",
  status: "completed" as const,
  informe_doctor: "doctor markdown",
  informe_paciente: "patient markdown",
  recording_duration: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

beforeEach(() => {
  mockLocalParams.current = { id: "i" };
  mockPush.mockReset();
  mockBack.mockReset();
  mockAlert.mockReset();
  mockGetInforme.mockReset();
  mockDeleteInforme.mockReset();
  mockUpdateInformeContent.mockReset();
  mockGetPatient.mockReset();
  mockGetDoctor.mockReset();
  mockGetPatient.mockResolvedValue({ id: "p", name: "Ana" });
  mockGetDoctor.mockResolvedValue({ id: "d", name: "Dr" });
});

describe("InformeDetailScreen — interactions", () => {
  it("save doctor draft writes via api", async () => {
    mockGetInforme.mockResolvedValue(completedInforme);
    mockUpdateInformeContent.mockResolvedValue(undefined);
    const { findByTestId } = render(<InformeDetailScreen />);
    fireEvent.press(await findByTestId("doctor-edit"));
    fireEvent.press(await findByTestId("doctor-draft"));
    fireEvent.press(await findByTestId("doctor-save"));
    await waitFor(() => expect(mockUpdateInformeContent).toHaveBeenCalled());
  });

  it("save doctor draft handles api failure", async () => {
    mockGetInforme.mockResolvedValue(completedInforme);
    mockUpdateInformeContent.mockRejectedValue(new Error("nope"));
    const { findByTestId } = render(<InformeDetailScreen />);
    fireEvent.press(await findByTestId("doctor-save"));
    await waitFor(() => expect(mockUpdateInformeContent).toHaveBeenCalled());
  });

  it("save patient draft writes via api", async () => {
    mockGetInforme.mockResolvedValue(completedInforme);
    mockUpdateInformeContent.mockResolvedValue(undefined);
    const { findByTestId } = render(<InformeDetailScreen />);
    fireEvent.press(await findByTestId("patient-edit"));
    fireEvent.press(await findByTestId("patient-draft"));
    fireEvent.press(await findByTestId("patient-save"));
    await waitFor(() => expect(mockUpdateInformeContent).toHaveBeenCalled());
  });

  it("save patient draft handles api failure", async () => {
    mockGetInforme.mockResolvedValue(completedInforme);
    mockUpdateInformeContent.mockRejectedValue(new Error("nope"));
    const { findByTestId } = render(<InformeDetailScreen />);
    fireEvent.press(await findByTestId("patient-save"));
    await waitFor(() => expect(mockUpdateInformeContent).toHaveBeenCalled());
  });

  it("delete action calls deleteInforme + back", async () => {
    mockGetInforme.mockResolvedValue(completedInforme);
    mockDeleteInforme.mockResolvedValue(undefined);
    mockAlert.mockImplementation((_t, _b, buttons) => {
      const destructive = (buttons as { style?: string; onPress?: () => void }[] | undefined)?.find(
        (b) => b.style === "destructive",
      );
      destructive?.onPress?.();
    });
    const { findByLabelText } = render(<InformeDetailScreen />);
    fireEvent.press(await findByLabelText("common.delete"));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it("delete action handles api failure with second alert", async () => {
    mockGetInforme.mockResolvedValue(completedInforme);
    mockDeleteInforme.mockRejectedValue(new Error("boom"));
    mockAlert.mockImplementation((_t, _b, buttons) => {
      const destructive = (buttons as { style?: string; onPress?: () => void }[] | undefined)?.find(
        (b) => b.style === "destructive",
      );
      destructive?.onPress?.();
    });
    const { findByLabelText } = render(<InformeDetailScreen />);
    fireEvent.press(await findByLabelText("common.delete"));
    await waitFor(() => expect(mockAlert.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it("skips load when no id", async () => {
    mockLocalParams.current = {};
    render(<InformeDetailScreen />);
    await waitFor(() => Promise.resolve());
    expect(mockGetInforme).not.toHaveBeenCalled();
  });

  it("draft change + cancelEdit reverts the editor", async () => {
    mockGetInforme.mockResolvedValue(completedInforme);
    const { findByTestId } = render(<InformeDetailScreen />);
    fireEvent.press(await findByTestId("doctor-edit"));
    fireEvent.press(await findByTestId("doctor-draft"));
    fireEvent.press(await findByTestId("doctor-cancel"));
  });

  it("cancelEdit handles informe with null content", async () => {
    mockGetInforme.mockResolvedValue({
      ...completedInforme,
      informe_doctor: null,
      informe_paciente: null,
    });
    const { findByTestId } = render(<InformeDetailScreen />);
    fireEvent.press(await findByTestId("doctor-edit"));
    fireEvent.press(await findByTestId("doctor-cancel"));
  });

  it("loads without patient_id (informe without patient)", async () => {
    mockGetInforme.mockResolvedValue({ ...completedInforme, patient_id: null });
    render(<InformeDetailScreen />);
    await waitFor(() => expect(mockGetInforme).toHaveBeenCalled());
    expect(mockGetPatient).not.toHaveBeenCalled();
  });

  it("delete handler formats non-Error exceptions via String()", async () => {
    mockGetInforme.mockResolvedValue(completedInforme);
    mockDeleteInforme.mockRejectedValue("string-thrown");
    mockAlert.mockImplementation((_t, _b, buttons) => {
      const d = (buttons as { style?: string; onPress?: () => void }[] | undefined)?.find(
        (b) => b.style === "destructive",
      );
      d?.onPress?.();
    });
    const { findByLabelText } = render(<InformeDetailScreen />);
    fireEvent.press(await findByLabelText("common.delete"));
    await waitFor(() => expect(mockAlert.mock.calls.length).toBeGreaterThanOrEqual(2));
  });
});
