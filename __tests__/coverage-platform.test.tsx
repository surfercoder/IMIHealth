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

jest.mock("@/src/lib/api/pdf", () => ({
  sharePdf: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/src/lib/api/whatsapp", () => ({
  sendCertificadoWhatsApp: jest.fn(),
  sendPedidosWhatsApp: jest.fn(),
  sendInformeWhatsApp: jest.fn(),
}));

// Override Platform.OS to non-iOS to hit the else branch in the modals'
// KeyboardAvoidingView behavior prop.
jest.mock("react-native/Libraries/Utilities/Platform", () => ({
  __esModule: true,
  default: {
    OS: "android",
    select: (specs: Record<string, unknown>) =>
      "android" in specs ? specs.android : specs.default,
  },
}));

import { CertificadoModal } from "@/src/components/informe-actions/CertificadoModal";
import { PedidosModal } from "@/src/components/informe-actions/PedidosModal";

beforeEach(() => {
  mockAlert.mockReset();
});

describe("CertificadoModal & PedidosModal Platform.OS=android", () => {
  it("CertificadoModal renders on android with undefined behavior", () => {
    render(
      <CertificadoModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor={null}
      />,
    );
  });

  it("PedidosModal renders on android with undefined behavior", () => {
    render(
      <PedidosModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor=""
      />,
    );
  });
});
