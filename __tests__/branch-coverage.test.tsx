import { fireEvent, render } from "@testing-library/react-native";

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

const mockI18nLanguage: { current: string | undefined } = { current: undefined };
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? k,
    i18n: { language: mockI18nLanguage.current },
  }),
}));

jest.mock("expo-router", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
    Link: ({ children }: { children: React.ReactNode }) =>
      React.createElement(RN.View, null, children),
    Stack: { Screen: () => null },
  };
});

jest.mock("@/src/hooks/useDoctor", () => ({
  useDoctor: () => ({
    doctor: { id: "d", name: "Dr X", avatar: null },
    loading: false,
    setDoctor: jest.fn(),
  }),
}));

jest.mock("@/src/i18n", () => ({
  SUPPORTED_LOCALES: ["es", "en"],
  setAppLocale: jest.fn(),
}));

import { InformeRow } from "@/src/components/InformeRow";
import { PatientCard } from "@/src/components/PatientCard";
import { AppHeader } from "@/src/components/AppHeader";

beforeEach(() => {
  mockI18nLanguage.current = undefined;
});

describe("language fallback branches", () => {
  it("InformeRow renders when i18n.language is undefined", () => {
    render(
      <InformeRow
        informe={{
          id: "i",
          doctor_id: "d",
          patient_id: null,
          status: "completed",
          informe_doctor: null,
          informe_paciente: null,
          recording_duration: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        }}
      />,
    );
  });

  it("PatientCard renders when i18n.language is undefined", () => {
    render(
      <PatientCard
        patient={{
          id: "p",
          name: "N",
          dni: null,
          email: null,
          phone: null,
          dob: null,
          obra_social: null,
          nro_afiliado: null,
          plan: null,
          created_at: "2024-01-01",
          informe_count: 0,
          last_informe_at: null,
          last_informe_status: null,
        }}
      />,
    );
  });

  it("AppHeader renders without doctor name", () => {
    render(<AppHeader showLogo={false} title="hi" />);
  });
});
