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

const mockSharePdf = jest.fn();
jest.mock("@/src/lib/api/pdf", () => ({
  sharePdf: (...a: unknown[]) => mockSharePdf(...a),
}));

const mockSendCert = jest.fn();
jest.mock("@/src/lib/api/whatsapp", () => ({
  sendCertificadoWhatsApp: (...a: unknown[]) => mockSendCert(...a),
}));

import { CertificadoModal } from "@/src/components/informe-actions/CertificadoModal";

beforeEach(() => {
  mockAlert.mockReset();
  mockSharePdf.mockReset();
  mockSendCert.mockReset();
});

describe("CertificadoModal", () => {
  it("generates and shows the success card", async () => {
    mockSharePdf.mockResolvedValue(undefined);
    const { getByText } = render(
      <CertificadoModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone="+1"
        informeDoctor="**Diagnostico presuntivo:** Gripe"
      />,
    );
    fireEvent.press(getByText("certificado.generate"));
    await waitFor(() => expect(mockSharePdf).toHaveBeenCalled());
  });

  it("alerts on share failure", async () => {
    mockSharePdf.mockRejectedValue(new Error("nope"));
    const { getByText } = render(
      <CertificadoModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor={null}
      />,
    );
    fireEvent.press(getByText("certificado.generate"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("sends whatsapp on press", async () => {
    mockSharePdf.mockResolvedValue(undefined);
    mockSendCert.mockResolvedValue({ success: true });
    const { getByText } = render(
      <CertificadoModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone="+1"
        informeDoctor=""
      />,
    );
    fireEvent.press(getByText("certificado.generate"));
    await waitFor(() => expect(mockSharePdf).toHaveBeenCalled());
    fireEvent.press(getByText("whatsappCertButton.label"));
    await waitFor(() => expect(mockSendCert).toHaveBeenCalled());
  });

  it("alerts on whatsapp failure", async () => {
    mockSharePdf.mockResolvedValue(undefined);
    mockSendCert.mockResolvedValue({ success: false, error: "boom" });
    const { getByText } = render(
      <CertificadoModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone="+1"
        informeDoctor=""
      />,
    );
    fireEvent.press(getByText("certificado.generate"));
    await waitFor(() => expect(mockSharePdf).toHaveBeenCalled());
    fireEvent.press(getByText("whatsappCertButton.label"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("alerts on whatsapp exception", async () => {
    mockSharePdf.mockResolvedValue(undefined);
    mockSendCert.mockRejectedValue(new Error("net"));
    const { getByText } = render(
      <CertificadoModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone="+1"
        informeDoctor=""
      />,
    );
    fireEvent.press(getByText("certificado.generate"));
    await waitFor(() => expect(mockSharePdf).toHaveBeenCalled());
    fireEvent.press(getByText("whatsappCertButton.label"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("close button triggers onClose", () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(
      <CertificadoModal
        visible
        onClose={onClose}
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor={null}
      />,
    );
    fireEvent.press(getByLabelText("common.cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("user typed values feed into options", async () => {
    mockSharePdf.mockResolvedValue(undefined);
    const { getByPlaceholderText, getByText } = render(
      <CertificadoModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor={null}
      />,
    );
    fireEvent.changeText(
      getByPlaceholderText("certificado.daysOffPlaceholder"),
      "3",
    );
    fireEvent.changeText(
      getByPlaceholderText("certificado.diagnosisPlaceholder"),
      "Diag",
    );
    fireEvent.changeText(
      getByPlaceholderText("certificado.observationsPlaceholder"),
      "Obs",
    );
    fireEvent.press(getByText("certificado.generate"));
    await waitFor(() => expect(mockSharePdf).toHaveBeenCalled());
    expect(mockSharePdf.mock.calls[0][0].options).toEqual({
      daysOff: 3,
      diagnosis: "Diag",
      observations: "Obs",
    });
  });

  it("whatsapp guard returns early when no phone", () => {
    const { queryByText } = render(
      <CertificadoModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor={null}
      />,
    );
    expect(queryByText("whatsappCertButton.label")).toBeNull();
  });
});
