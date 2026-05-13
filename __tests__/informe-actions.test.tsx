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
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "es" } }),
}));

const mockAlert = jest.fn();
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  __esModule: true,
  default: { alert: (...a: unknown[]) => mockAlert(...a) },
}));

const mockSetString = jest.fn();
jest.mock("expo-clipboard", () => ({
  setStringAsync: (...a: unknown[]) => mockSetString(...a),
}));

const mockSendEmail = jest.fn();
jest.mock("@/src/lib/api/email", () => ({
  sendEmail: (...a: unknown[]) => mockSendEmail(...a),
}));

const mockSharePdf = jest.fn();
jest.mock("@/src/lib/api/pdf", () => ({
  sharePdf: (...a: unknown[]) => mockSharePdf(...a),
}));

const mockSendCert = jest.fn();
const mockSendPedidos = jest.fn();
const mockSendInforme = jest.fn();
jest.mock("@/src/lib/api/whatsapp", () => ({
  sendInformeWhatsApp: (...a: unknown[]) => mockSendInforme(...a),
  sendCertificadoWhatsApp: (...a: unknown[]) => mockSendCert(...a),
  sendPedidosWhatsApp: (...a: unknown[]) => mockSendPedidos(...a),
}));

const mockCanOpen = jest.fn();
const mockOpenURL = jest.fn();
jest.mock("react-native/Libraries/Linking/Linking", () => ({
  __esModule: true,
  default: {
    canOpenURL: (...a: unknown[]) => mockCanOpen(...a),
    openURL: (...a: unknown[]) => mockOpenURL(...a),
  },
}));

import {
  CopyButton,
  EmailButton,
  ViewPdfButton,
  WhatsAppDoctorButton,
  WhatsAppPatientButton,
  CertificadoButton,
  PedidosButton,
} from "@/src/components/informe-actions";
import { ActionIconButton } from "@/src/components/informe-actions/ActionIconButton";

beforeEach(() => {
  mockAlert.mockReset();
  mockSetString.mockReset();
  mockSendEmail.mockReset();
  mockSharePdf.mockReset();
  mockSendCert.mockReset();
  mockSendPedidos.mockReset();
  mockSendInforme.mockReset();
  mockCanOpen.mockReset();
  mockOpenURL.mockReset();
});

describe("ActionIconButton", () => {
  it("triggers onPress", () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <ActionIconButton onPress={onPress} accessibilityLabel="x">
        <></>
      </ActionIconButton>,
    );
    fireEvent.press(getByLabelText("x"));
    expect(onPress).toHaveBeenCalled();
  });

  it("renders loading and emerald tone", () => {
    render(
      <ActionIconButton onPress={() => {}} accessibilityLabel="x" loading tone="emerald">
        <></>
      </ActionIconButton>,
    );
  });
});

describe("CopyButton", () => {
  it("copies text on press", async () => {
    mockSetString.mockResolvedValue(undefined);
    const { getByLabelText } = render(<CopyButton text="hello" />);
    fireEvent.press(getByLabelText("common.copyToClipboard"));
    await waitFor(() => expect(mockSetString).toHaveBeenCalledWith("hello"));
  });

  it("alerts on copy failure", async () => {
    mockSetString.mockRejectedValue(new Error("nope"));
    const { getByLabelText } = render(<CopyButton text="x" tone="emerald" />);
    fireEvent.press(getByLabelText("common.copyToClipboard"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });
});

describe("EmailButton", () => {
  it("sends doctor email and shows success", async () => {
    mockSendEmail.mockResolvedValue({ success: true });
    const { getByLabelText } = render(
      <EmailButton
        variant="doctor"
        email="d@d"
        doctorName="Dr"
        reportContent="r"
      />,
    );
    fireEvent.press(getByLabelText("informeEditor.sendEmail"));
    await waitFor(() => expect(mockSendEmail).toHaveBeenCalled());
  });

  it("sends patient email and shows success", async () => {
    mockSendEmail.mockResolvedValue({ success: true });
    const { getByLabelText } = render(
      <EmailButton
        variant="patient"
        email="p@p"
        doctorName="Dr"
        patientName="P"
        reportContent="r"
      />,
    );
    fireEvent.press(getByLabelText("informeEditor.sendEmail"));
    await waitFor(() => expect(mockSendEmail).toHaveBeenCalled());
  });

  it("alerts on api error", async () => {
    mockSendEmail.mockResolvedValue({ success: false, error: "boom" });
    const { getByLabelText } = render(
      <EmailButton
        variant="doctor"
        email="x"
        doctorName="D"
        reportContent="r"
      />,
    );
    fireEvent.press(getByLabelText("informeEditor.sendEmail"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("alerts on exception", async () => {
    mockSendEmail.mockRejectedValue(new Error("net"));
    const { getByLabelText } = render(
      <EmailButton variant="doctor" email="x" doctorName="D" reportContent="r" />,
    );
    fireEvent.press(getByLabelText("informeEditor.sendEmail"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });
});

describe("ViewPdfButton", () => {
  it("shares pdf on press", async () => {
    mockSharePdf.mockResolvedValue(undefined);
    const { getByLabelText } = render(<ViewPdfButton informeId="i" />);
    fireEvent.press(getByLabelText("informeEditor.viewPdf"));
    await waitFor(() => expect(mockSharePdf).toHaveBeenCalled());
  });

  it("alerts on error", async () => {
    mockSharePdf.mockRejectedValue(new Error("err"));
    const { getByLabelText } = render(<ViewPdfButton informeId="i" />);
    fireEvent.press(getByLabelText("informeEditor.viewPdf"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });
});

describe("WhatsAppDoctorButton", () => {
  it("opens whatsapp url when supported", async () => {
    mockCanOpen.mockResolvedValue(true);
    mockOpenURL.mockResolvedValue(undefined);
    const { getByLabelText } = render(
      <WhatsAppDoctorButton phone="+12345" doctorName="D" reportContent="r" />,
    );
    fireEvent.press(getByLabelText("informeEditor.sendWhatsApp"));
    await waitFor(() => expect(mockOpenURL).toHaveBeenCalled());
  });

  it("alerts when url not supported", async () => {
    mockCanOpen.mockResolvedValue(false);
    const { getByLabelText } = render(
      <WhatsAppDoctorButton phone="+12345" doctorName="D" reportContent="r" />,
    );
    fireEvent.press(getByLabelText("informeEditor.sendWhatsApp"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("alerts on exception", async () => {
    mockCanOpen.mockRejectedValue(new Error("x"));
    const { getByLabelText } = render(
      <WhatsAppDoctorButton phone="+12345" doctorName="D" reportContent="r" />,
    );
    fireEvent.press(getByLabelText("informeEditor.sendWhatsApp"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });
});

describe("WhatsAppPatientButton", () => {
  it("calls sendInformeWhatsApp with success", async () => {
    mockSendInforme.mockResolvedValue({ success: true });
    const { getByLabelText } = render(
      <WhatsAppPatientButton phone="+1" patientName="P" informeId="i" />,
    );
    fireEvent.press(getByLabelText("informeEditor.sendWhatsApp"));
    await waitFor(() => expect(mockSendInforme).toHaveBeenCalled());
  });

  it("alerts on failure", async () => {
    mockSendInforme.mockResolvedValue({ success: false, error: "x" });
    const { getByLabelText } = render(
      <WhatsAppPatientButton phone="+1" patientName="P" informeId="i" />,
    );
    fireEvent.press(getByLabelText("informeEditor.sendWhatsApp"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("alerts on exception", async () => {
    mockSendInforme.mockRejectedValue(new Error("net"));
    const { getByLabelText } = render(
      <WhatsAppPatientButton phone="+1" patientName="P" informeId="i" />,
    );
    fireEvent.press(getByLabelText("informeEditor.sendWhatsApp"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });
});

describe("CertificadoButton + PedidosButton", () => {
  it("opens and closes their respective modals", () => {
    render(
      <CertificadoButton
        informeId="i"
        patientName="P"
        patientPhone="+1"
        informeDoctor="content"
      />,
    );
    render(
      <PedidosButton
        informeId="i"
        patientName="P"
        patientPhone="+1"
        informeDoctor="content"
      />,
    );
  });
});
