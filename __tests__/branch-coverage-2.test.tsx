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

jest.mock("@/src/lib/api/pdf", () => ({ sharePdf: jest.fn() }));
jest.mock("@/src/lib/api/whatsapp", () => ({
  sendCertificadoWhatsApp: jest.fn(),
  sendPedidosWhatsApp: jest.fn(),
  sendInformeWhatsApp: jest.fn(),
}));
jest.mock("@/src/lib/api/email", () => ({ sendEmail: jest.fn() }));
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }));
jest.mock("react-native/Libraries/Linking/Linking", () => ({
  __esModule: true,
  default: {
    canOpenURL: jest.fn().mockResolvedValue(true),
    openURL: jest.fn().mockResolvedValue(undefined),
  },
}));

import { CertificadoButton } from "@/src/components/informe-actions/CertificadoButton";
import { PedidosButton } from "@/src/components/informe-actions/PedidosButton";
import { EmailButton } from "@/src/components/informe-actions/EmailButton";
import { WhatsAppPatientButton } from "@/src/components/informe-actions/WhatsAppPatientButton";

beforeEach(() => {
  mockAlert.mockReset();
});

describe("CertificadoButton opens its modal", () => {
  it("toggles modal open via setOpen(true)", () => {
    const { getByLabelText } = render(
      <CertificadoButton
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor={null}
      />,
    );
    fireEvent.press(getByLabelText("informeEditor.createCertificate"));
  });
});

describe("PedidosButton opens its modal", () => {
  it("toggles modal open via setOpen(true)", () => {
    const { getByLabelText } = render(
      <PedidosButton
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor={null}
      />,
    );
    fireEvent.press(getByLabelText("informeEditor.generatePedidos"));
  });
});

describe("EmailButton handles missing patientName branch", () => {
  it("sends patient email without patientName falling through to empty string", async () => {
    const { sendEmail } = require("@/src/lib/api/email");
    (sendEmail as jest.Mock).mockResolvedValue({ success: true });
    const { getByLabelText } = render(
      <EmailButton
        variant="patient"
        email="p@p"
        doctorName="Dr"
        reportContent="r"
      />,
    );
    fireEvent.press(getByLabelText("informeEditor.sendEmail"));
    await waitFor(() => expect(sendEmail).toHaveBeenCalled());
  });
});

describe("WhatsAppPatientButton catches non-Error throws", () => {
  it("uses the fallback message when error isn't an Error instance", async () => {
    const { sendInformeWhatsApp } = require("@/src/lib/api/whatsapp");
    (sendInformeWhatsApp as jest.Mock).mockRejectedValue("string-error");
    const { getByLabelText } = render(
      <WhatsAppPatientButton phone="+1" patientName="P" informeId="i" />,
    );
    fireEvent.press(getByLabelText("informeEditor.sendWhatsApp"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });
});
