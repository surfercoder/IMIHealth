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

const mockAlert = jest.fn();
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  __esModule: true,
  default: { alert: (...a: unknown[]) => mockAlert(...a) },
}));

const mockSendEmail = jest.fn();
jest.mock("@/src/lib/api/email", () => ({
  sendEmail: (...a: unknown[]) => mockSendEmail(...a),
}));

const mockSendInformeWA = jest.fn();
jest.mock("@/src/lib/api/whatsapp", () => ({
  sendInformeWhatsApp: (...a: unknown[]) => mockSendInformeWA(...a),
  sendCertificadoWhatsApp: jest.fn(),
  sendPedidosWhatsApp: jest.fn(),
}));

const mockSharePdf = jest.fn();
jest.mock("@/src/lib/api/pdf", () => ({
  sharePdf: (...a: unknown[]) => mockSharePdf(...a),
}));

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

import { EmailButton } from "@/src/components/informe-actions/EmailButton";
import { WhatsAppPatientButton } from "@/src/components/informe-actions/WhatsAppPatientButton";
import { ViewPdfButton } from "@/src/components/informe-actions/ViewPdfButton";

beforeEach(() => {
  mockAlert.mockReset();
  mockSendEmail.mockReset();
  mockSendInformeWA.mockReset();
  mockSharePdf.mockReset();
});

describe("EmailButton patient variant with name vs without", () => {
  it("uses provided patientName in labels", async () => {
    mockSendEmail.mockResolvedValue({ success: true });
    const { getByLabelText } = render(
      <EmailButton
        variant="patient"
        email="p@p"
        doctorName="Dr"
        patientName="Ana"
        reportContent="r"
      />,
    );
    fireEvent.press(getByLabelText("informeEditor.sendEmail"));
    await waitFor(() => expect(mockSendEmail).toHaveBeenCalled());
  });

  it("alerts with fallback message when server response has no error", async () => {
    mockSendEmail.mockResolvedValue({ success: false });
    const { getByLabelText } = render(
      <EmailButton
        variant="doctor"
        email="d@d"
        doctorName="Dr"
        reportContent="r"
      />,
    );
    fireEvent.press(getByLabelText("informeEditor.sendEmail"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });
});

describe("WhatsAppPatientButton fallback message paths", () => {
  it("uses provided server error when present", async () => {
    mockSendInformeWA.mockResolvedValue({ success: false, error: "wa boom" });
    const { getByLabelText } = render(
      <WhatsAppPatientButton phone="+1" patientName="P" informeId="i" />,
    );
    fireEvent.press(getByLabelText("informeEditor.sendWhatsApp"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("uses default error message when server response has no error", async () => {
    mockSendInformeWA.mockResolvedValue({ success: false });
    const { getByLabelText } = render(
      <WhatsAppPatientButton phone="+1" patientName="P" informeId="i" />,
    );
    fireEvent.press(getByLabelText("informeEditor.sendWhatsApp"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });
});

describe("ViewPdfButton default tone branch", () => {
  it("renders with default tone (no tone prop)", async () => {
    mockSharePdf.mockResolvedValue(undefined);
    const { getByLabelText } = render(<ViewPdfButton informeId="i" />);
    fireEvent.press(getByLabelText("informeEditor.viewPdf"));
    await waitFor(() => expect(mockSharePdf).toHaveBeenCalled());
  });
});
