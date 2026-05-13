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

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "es" } }),
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/src/hooks/usePatients", () => ({
  usePatients: () => ({
    patients: [
      {
        id: "p",
        name: "Ana",
        dni: "1",
        phone: null,
        email: null,
        dob: null,
        obra_social: null,
        nro_afiliado: null,
        plan: null,
        created_at: "2024-01-01",
        informe_count: 0,
        last_informe_at: null,
        last_informe_status: null,
      },
    ],
    loading: false,
    refreshing: false,
    refresh: jest.fn(),
  }),
}));

jest.mock("@/src/components/AppHeader", () => ({ AppHeader: () => null }));

import PatientsTab from "@/app/(app)/(tabs)/patients";

describe("PatientsTab row press handler", () => {
  it("triggers handlePressPatient → push", () => {
    const { getByText } = render(<PatientsTab />);
    fireEvent.press(getByText("Ana"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/patient/[id]" }),
    );
  });
});
