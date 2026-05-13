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

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? k,
    i18n: { language: "es" },
  }),
}));

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockLocalParams: { current: Record<string, unknown> } = { current: {} };

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
  useLocalSearchParams: () => mockLocalParams.current,
  Stack: { Screen: () => null },
}));

const mockUser: { current: { id: string } | null } = { current: { id: "u" } };
jest.mock("@/src/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: mockUser.current,
    initialized: true,
    session: mockUser.current ? { user: mockUser.current } : null,
    signOut: jest.fn(),
  }),
}));

const mockGetInforme = jest.fn();
const mockGetDoctor = jest.fn();
const mockGetPatient = jest.fn();
jest.mock("@/src/lib/api/informes", () => ({
  getInforme: (...a: unknown[]) => mockGetInforme(...a),
  deleteInforme: jest.fn(),
  updateInformeContent: jest.fn(),
}));
jest.mock("@/src/lib/api/patients", () => ({
  getPatient: (...a: unknown[]) => mockGetPatient(...a),
}));
jest.mock("@/src/lib/api/doctors", () => ({
  getDoctor: (...a: unknown[]) => mockGetDoctor(...a),
}));

jest.mock("@/src/components/informe/DoctorReportCard", () => {
  const React = require("react");
  const RN = require("react-native");
  return { DoctorReportCard: () => React.createElement(RN.View) };
});
jest.mock("@/src/components/informe/PatientReportCard", () => {
  const React = require("react");
  const RN = require("react-native");
  return { PatientReportCard: () => React.createElement(RN.View) };
});

import InformeDetailScreen from "@/app/(app)/informe/[id]";

beforeEach(() => {
  mockPush.mockReset();
  mockBack.mockReset();
  mockReplace.mockReset();
  mockGetInforme.mockReset();
  mockGetDoctor.mockReset();
  mockGetPatient.mockReset();
  mockLocalParams.current = { id: "i" };
  mockUser.current = { id: "u" };
});

describe("InformeDetailScreen extra branches", () => {
  it("loads doctor as null when user is absent", async () => {
    mockUser.current = null;
    mockGetInforme.mockResolvedValue({
      id: "i",
      doctor_id: "d",
      patient_id: null,
      status: "completed",
      informe_doctor: "",
      informe_paciente: "",
      recording_duration: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    });
    render(<InformeDetailScreen />);
    await waitFor(() => expect(mockGetInforme).toHaveBeenCalled());
    expect(mockGetDoctor).not.toHaveBeenCalled();
  });

  it("record-again navigates with quick mode when patient_id is null", async () => {
    mockGetInforme.mockResolvedValue({
      id: "i",
      doctor_id: "d",
      patient_id: null,
      status: "error",
      informe_doctor: "",
      informe_paciente: "",
      recording_duration: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    });
    const { findByText } = render(<InformeDetailScreen />);
    const btn = await findByText("informePage.recordAgain");
    fireEvent.press(btn);
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/record",
        params: expect.objectContaining({ mode: "quick" }),
      }),
    );
  });

  it("record-again navigates with classic mode when patient_id is present", async () => {
    mockGetInforme.mockResolvedValue({
      id: "i",
      doctor_id: "d",
      patient_id: "p",
      status: "error",
      informe_doctor: "",
      informe_paciente: "",
      recording_duration: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    });
    mockGetPatient.mockResolvedValue({ id: "p" });
    const { findByText } = render(<InformeDetailScreen />);
    const btn = await findByText("informePage.recordAgain");
    fireEvent.press(btn);
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/record",
        params: expect.objectContaining({ mode: "classic" }),
      }),
    );
  });
});

void act;
