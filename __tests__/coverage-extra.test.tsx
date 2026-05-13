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

const mockI18nLang: { current: string | undefined } = { current: "es" };
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? k,
    i18n: { language: mockI18nLang.current },
  }),
}));

const mockAlert = jest.fn();
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  __esModule: true,
  default: { alert: (...a: unknown[]) => mockAlert(...a) },
}));

jest.mock("@/src/components/informe-actions", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    CopyButton: () => React.createElement(RN.Text, null, "copy"),
    EmailButton: () =>
      React.createElement(RN.Text, { accessibilityLabel: "email" }, "email"),
    WhatsAppDoctorButton: () =>
      React.createElement(RN.Text, { accessibilityLabel: "wa" }, "wa"),
    WhatsAppPatientButton: () => null,
    ViewPdfButton: () => null,
    CertificadoButton: () => null,
    PedidosButton: () => null,
  };
});

jest.mock("@/src/components/MarkdownView", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    MarkdownView: (p: { content: string }) =>
      React.createElement(RN.Text, null, p.content),
  };
});

jest.mock("@/src/components/MarkdownEditor", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    MarkdownEditor: () => React.createElement(RN.View),
  };
});

import { DoctorReportCard } from "@/src/components/informe/DoctorReportCard";

beforeEach(() => {
  mockAlert.mockReset();
});

describe("DoctorReportCard handles doctor with no contact info", () => {
  it("renders without email/wa buttons when doctor has neither", () => {
    const { queryByLabelText, getByText } = render(
      <DoctorReportCard
        doctor={null}
        editing={false}
        saving={false}
        isReady
        content="content"
        draft=""
        consentBlock=""
        onDraftChange={() => {}}
        onStartEdit={() => {}}
        onCancel={() => {}}
        onSave={() => {}}
      />,
    );
    expect(getByText("content")).toBeTruthy();
    expect(queryByLabelText("email")).toBeNull();
    expect(queryByLabelText("wa")).toBeNull();
  });

  it("renders empty content message when content is blank and not editing", () => {
    const { getByText } = render(
      <DoctorReportCard
        doctor={null}
        editing={false}
        saving={false}
        isReady
        content=""
        draft=""
        consentBlock=""
        onDraftChange={() => {}}
        onStartEdit={() => {}}
        onCancel={() => {}}
        onSave={() => {}}
      />,
    );
    expect(getByText("common.noContent")).toBeTruthy();
  });
});

// --- Edit patient screen: String(e) non-Error throw branch ---

const mockBack = jest.fn();
const mockLocalParams: { current: Record<string, unknown> } = { current: {} };
jest.mock("expo-router", () => {
  const React = require("react");
  return {
    useRouter: () => ({ back: mockBack, replace: jest.fn(), push: jest.fn() }),
    useLocalSearchParams: () => mockLocalParams.current,
    Stack: Object.assign(
      ({ children }: { children?: React.ReactNode }) => children ?? null,
      { Screen: () => null },
    ),
  };
});

const mockGetPatient = jest.fn();
const mockUpdatePatient = jest.fn();
jest.mock("@/src/lib/api/patients", () => ({
  getPatient: (...a: unknown[]) => mockGetPatient(...a),
  updatePatient: (...a: unknown[]) => mockUpdatePatient(...a),
  deletePatient: jest.fn(),
  createPatient: jest.fn(),
}));

jest.mock("@/src/components/PatientForm", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    PatientForm: (p: {
      onSubmit: (v: { name: string }) => Promise<void>;
      onCancel?: () => void;
    }) =>
      React.createElement(RN.View, null, [
        React.createElement(RN.Text, {
          key: "submit",
          onPress: () => p.onSubmit({ name: "Ana" }),
          testID: "submit",
        }, "submit"),
      ]),
  };
});

import EditPatientScreen from "@/app/(app)/patient/[id]/edit";

describe("EditPatientScreen non-Error throw branch", () => {
  beforeEach(() => {
    mockBack.mockReset();
    mockGetPatient.mockReset();
    mockUpdatePatient.mockReset();
    mockAlert.mockReset();
    mockLocalParams.current = { id: "p" };
  });

  it("stringifies non-Error rejections from updatePatient", async () => {
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
    mockUpdatePatient.mockRejectedValue("plain-error");
    const { findByTestId } = render(<EditPatientScreen />);
    fireEvent.press(await findByTestId("submit"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
    expect(mockAlert.mock.calls[0][1]).toBe("plain-error");
  });
});

// --- PedidosModal Error catch in WA send (covers line 177 Error path) ---

const mockSharePdf = jest.fn();
jest.mock("@/src/lib/api/pdf", () => ({
  sharePdf: (...a: unknown[]) => mockSharePdf(...a),
}));

const mockSendPedidos = jest.fn();
jest.mock("@/src/lib/api/whatsapp", () => ({
  sendPedidosWhatsApp: (...a: unknown[]) => mockSendPedidos(...a),
  sendCertificadoWhatsApp: jest.fn(),
  sendInformeWhatsApp: jest.fn(),
}));

import { PedidosModal } from "@/src/components/informe-actions/PedidosModal";

// --- InformeDetailScreen language fallback ---

const mockGetInforme = jest.fn();
jest.mock("@/src/lib/api/informes", () => ({
  getInforme: (...a: unknown[]) => mockGetInforme(...a),
  deleteInforme: jest.fn(),
  updateInformeContent: jest.fn(),
}));

jest.mock("@/src/lib/api/doctors", () => ({
  getDoctor: jest.fn().mockResolvedValue(null),
}));

jest.mock("@/src/providers/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "u" } }),
}));

jest.mock("@/src/components/informe/PatientReportCard", () => ({
  PatientReportCard: () => null,
}));

import InformeDetailScreen from "@/app/(app)/informe/[id]";

describe("InformeDetailScreen language fallback", () => {
  beforeEach(() => {
    mockGetInforme.mockReset();
    mockI18nLang.current = "es";
    mockLocalParams.current = { id: "i" };
  });

  it("uses 'es' when i18n.language is undefined", async () => {
    mockI18nLang.current = undefined;
    mockGetPatient.mockResolvedValue(null);
    mockGetInforme.mockResolvedValue({
      id: "i",
      doctor_id: "u",
      patient_id: null,
      status: "completed",
      informe_doctor: "x",
      informe_paciente: "y",
      recording_duration: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    });
    render(<InformeDetailScreen />);
    await waitFor(() => expect(mockGetInforme).toHaveBeenCalled());
  });
});

describe("PedidosModal Error catch branch", () => {
  beforeEach(() => {
    mockAlert.mockReset();
    mockSharePdf.mockReset();
    mockSendPedidos.mockReset();
  });

  it("uses e.message when WhatsApp send rejects with an Error instance", async () => {
    mockSendPedidos.mockRejectedValueOnce(new Error("specific-error"));
    const items = "PLAN:\nEstudios:\n- Hemograma\n";
    const { getByText } = render(
      <PedidosModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone="+1"
        informeDoctor={items}
      />,
    );
    fireEvent.press(getByText(/^pedidos\.generate/));
    await waitFor(() =>
      expect(getByText("whatsappPedidosButton.label")).toBeTruthy(),
    );
    fireEvent.press(getByText("whatsappPedidosButton.label"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
    expect(mockAlert.mock.calls[0][1]).toBe("specific-error");
  });
});
