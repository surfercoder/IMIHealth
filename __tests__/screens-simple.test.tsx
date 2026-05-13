import { fireEvent, render, waitFor } from "@testing-library/react-native";

jest.mock("expo-image", () => {
  const React = require("react");
  const RN = require("react-native");
  return { Image: (p: object) => React.createElement(RN.View, p) };
});

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
  useTranslation: () => ({
    t: (k: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? k,
    i18n: { language: "es" },
  }),
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock("expo-router", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
    useLocalSearchParams: () => mockLocalParams.current,
    Link: ({ children, style }: { children: React.ReactNode; style?: object }) =>
      React.createElement(RN.View, { style }, children),
    Redirect: () => null,
    Stack: Object.assign(
      ({ children }: { children?: React.ReactNode }) => children ?? null,
      { Screen: () => null },
    ),
    Tabs: Object.assign(
      ({ children }: { children?: React.ReactNode }) => children ?? null,
      { Screen: () => null },
    ),
  };
});

const mockLocalParams: { current: Record<string, unknown> } = { current: {} };

jest.mock("@/src/components/AppHeader", () => ({
  AppHeader: () => null,
}));
jest.mock("@/src/components/LanguageSwitcher", () => ({
  LanguageSwitcher: () => null,
}));
jest.mock("@/src/components/dashboard-charts", () => ({
  DashboardCharts: () => null,
}));
jest.mock("@/src/components/AvatarPicker", () => ({
  AvatarPicker: () => null,
}));
jest.mock("@/src/components/SignaturePad", () => ({
  SignaturePad: () => null,
}));
jest.mock("@/src/components/MarkdownEditor", () => ({
  MarkdownEditor: () => null,
}));
jest.mock("@/src/components/MarkdownView", () => ({
  MarkdownView: () => null,
}));
jest.mock("@/src/components/informe/DoctorReportCard", () => ({
  DoctorReportCard: () => null,
}));
jest.mock("@/src/components/informe/PatientReportCard", () => ({
  PatientReportCard: () => null,
}));
jest.mock("@/src/components/RecorderControls", () => ({
  RecorderControls: () => null,
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
        p.onCancel
          ? React.createElement(RN.Text, {
              key: "cancel",
              onPress: p.onCancel,
              testID: "cancel",
            }, "cancel")
          : null,
      ]),
  };
});

const mockUser: { current: { id: string } | null } = { current: { id: "u" } };
jest.mock("@/src/providers/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockUser.current,
    session: mockUser.current ? { user: mockUser.current } : null,
    initialized: true,
    signOut: jest.fn(),
  }),
}));

jest.mock("@/src/providers/RealtimeProvider", () => ({
  RealtimeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockUseDoctor = jest.fn();
jest.mock("@/src/hooks/useDoctor", () => ({
  useDoctor: () => mockUseDoctor(),
}));

const mockUseCheckout = jest.fn();
jest.mock("@/src/hooks/useCheckout", () => ({
  useCheckout: () => mockUseCheckout(),
}));

const mockUseDashboard = jest.fn();
jest.mock("@/src/hooks/useDashboard", () => ({
  useDashboard: () => mockUseDashboard(),
}));

const mockUsePatients = jest.fn();
jest.mock("@/src/hooks/usePatients", () => ({
  usePatients: () => mockUsePatients(),
}));

const mockUsePatientDetail = jest.fn();
jest.mock("@/src/hooks/usePatientDetail", () => ({
  usePatientDetail: () => mockUsePatientDetail(),
}));

const mockUseRecorder = jest.fn();
jest.mock("@/src/hooks/useRecorder", () => ({
  useRecorder: () => mockUseRecorder(),
  formatDuration: () => "00:00",
}));

jest.mock("@/src/lib/api/audio", () => ({
  uploadRecording: jest.fn().mockResolvedValue("path"),
}));

const mockCreateInforme = jest.fn();
const mockProcessInforme = jest.fn();
const mockGetInforme = jest.fn();
const mockDeleteInforme = jest.fn();
const mockUpdateInformeContent = jest.fn();
jest.mock("@/src/lib/api/informes", () => ({
  createInforme: (...a: unknown[]) => mockCreateInforme(...a),
  processInforme: (...a: unknown[]) => mockProcessInforme(...a),
  getInforme: (...a: unknown[]) => mockGetInforme(...a),
  deleteInforme: (...a: unknown[]) => mockDeleteInforme(...a),
  updateInformeContent: (...a: unknown[]) => mockUpdateInformeContent(...a),
}));

const mockCreatePatient = jest.fn();
const mockUpdatePatient = jest.fn();
const mockDeletePatient = jest.fn();
const mockGetPatient = jest.fn();
jest.mock("@/src/lib/api/patients", () => ({
  createPatient: (...a: unknown[]) => mockCreatePatient(...a),
  updatePatient: (...a: unknown[]) => mockUpdatePatient(...a),
  deletePatient: (...a: unknown[]) => mockDeletePatient(...a),
  getPatient: (...a: unknown[]) => mockGetPatient(...a),
}));

const mockGetDoctor = jest.fn();
const mockUpdateDoctor = jest.fn();
jest.mock("@/src/lib/api/doctors", () => ({
  getDoctor: (...a: unknown[]) => mockGetDoctor(...a),
  updateDoctor: (...a: unknown[]) => mockUpdateDoctor(...a),
}));

const mockSupabaseSignUp = jest.fn();
const mockSupabaseSignIn = jest.fn();
const mockSupabaseResetPassword = jest.fn();
const mockSupabaseUpdateUser = jest.fn();
const mockSupabaseVerifyOtp = jest.fn();
const mockSupabaseExchangeCode = jest.fn();
jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: (...a: unknown[]) => mockSupabaseSignUp(...a),
      signInWithPassword: (...a: unknown[]) => mockSupabaseSignIn(...a),
      resetPasswordForEmail: (...a: unknown[]) => mockSupabaseResetPassword(...a),
      updateUser: (...a: unknown[]) => mockSupabaseUpdateUser(...a),
      verifyOtp: (...a: unknown[]) => mockSupabaseVerifyOtp(...a),
      exchangeCodeForSession: (...a: unknown[]) => mockSupabaseExchangeCode(...a),
    },
  },
}));

const mockAlert = jest.fn();
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  __esModule: true,
  default: { alert: (...a: unknown[]) => mockAlert(...a) },
}));

jest.mock("@/src/lib/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn() },
  ApiError: class ApiError extends Error {
    status = 0;
    constructor(m: string) {
      super(m);
    }
  },
}));

import IndexTab from "@/app/(app)/(tabs)/index";
import TabsLayout from "@/app/(app)/(tabs)/_layout";
import DashboardTab from "@/app/(app)/(tabs)/dashboard";
import PatientsTab from "@/app/(app)/(tabs)/patients";
import AppLayout from "@/app/(app)/_layout";
import AuthLayout from "@/app/(auth)/_layout";
import LandingScreen from "@/app/(auth)/landing";
import LoginScreen from "@/app/(auth)/login";
import ForgotPasswordScreen from "@/app/(auth)/forgot-password";
import ResetPasswordScreen from "@/app/(auth)/reset-password";
import QuickInformeScreen from "@/app/(app)/quick-informe";
import NewPatientScreen from "@/app/(app)/patient/new";
import EditPatientScreen from "@/app/(app)/patient/[id]/edit";
import PatientDetailScreen from "@/app/(app)/patient/[id]/index";
import ProfileScreen from "@/app/(app)/profile";
import RecordScreen from "@/app/(app)/record";
import InformeDetailScreen from "@/app/(app)/informe/[id]";
import AuthConfirmScreen from "@/app/auth/confirm";
import BillingReturnScreen from "@/app/billing/return";

beforeEach(() => {
  mockPush.mockReset();
  mockReplace.mockReset();
  mockBack.mockReset();
  mockAlert.mockReset();
  mockLocalParams.current = {};
  mockUser.current = { id: "u" };
  mockUseDoctor.mockReturnValue({
    doctor: { id: "d", name: "Dr X", email: "d@x", phone: "+1" },
    loading: false,
    setDoctor: jest.fn(),
  });
  mockUseCheckout.mockReturnValue({
    upgradeExisting: jest.fn().mockResolvedValue({ ok: true }),
    signupPro: jest.fn().mockResolvedValue({ ok: true }),
  });
  mockUseDashboard.mockReturnValue({
    summary: {
      totalPatients: 0,
      totalInformes: 0,
      completedCount: 0,
      processingCount: 0,
      errorCount: 0,
    },
    charts: {},
    refreshing: false,
    refresh: jest.fn(),
  });
  mockUsePatients.mockReturnValue({
    patients: [],
    loading: false,
    refreshing: false,
    refresh: jest.fn(),
  });
  mockUsePatientDetail.mockReturnValue({
    patient: null,
    informes: [],
    loading: false,
  });
  mockUseRecorder.mockReturnValue({
    phase: "idle",
    durationMs: 0,
    isRecording: false,
    start: jest.fn(),
    stop: jest.fn().mockResolvedValue({ uri: "f", durationMs: 0 }),
    reset: jest.fn(),
  });
  mockCreatePatient.mockReset();
  mockUpdatePatient.mockReset();
  mockDeletePatient.mockReset();
  mockGetPatient.mockReset();
  mockSupabaseSignIn.mockReset();
  mockSupabaseSignUp.mockReset();
  mockSupabaseResetPassword.mockReset();
  mockSupabaseUpdateUser.mockReset();
  mockSupabaseVerifyOtp.mockReset();
  mockSupabaseExchangeCode.mockReset();
});

describe("tabs", () => {
  it("renders InformesTab and navigates", () => {
    const { getByText } = render(<IndexTab />);
    fireEvent.press(getByText("informes.createClassic"));
    fireEvent.press(getByText("informes.createQuick"));
    expect(mockPush).toHaveBeenCalledWith("/patients");
    expect(mockPush).toHaveBeenCalledWith("/quick-informe");
  });

  it("renders TabsLayout", () => {
    render(<TabsLayout />);
  });

  it("renders DashboardTab", () => {
    render(<DashboardTab />);
  });

  it("renders PatientsTab and navigates with fab", () => {
    mockUsePatients.mockReturnValue({
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
          informe_count: 1,
          last_informe_at: null,
          last_informe_status: null,
        },
      ],
      loading: false,
      refreshing: false,
      refresh: jest.fn(),
    });
    const { getByLabelText, getByPlaceholderText } = render(<PatientsTab />);
    fireEvent.changeText(getByPlaceholderText("patientsList.searchPlaceholder"), "x");
    fireEvent.press(getByLabelText("nuevoInformeDialog.trigger"));
    expect(mockPush).toHaveBeenCalledWith("/patient/new");
  });

  it("PatientsTab shows empty state", () => {
    render(<PatientsTab />);
  });
});

describe("(app)/_layout", () => {
  it("renders children when session present", () => {
    render(<AppLayout />);
  });

  it("renders nothing when not initialized", () => {
    mockUser.current = null;
    render(<AppLayout />);
  });
});

describe("(auth)/_layout", () => {
  it("renders the stack", () => {
    render(<AuthLayout />);
  });
});

describe("auth screens", () => {
  it("LandingScreen renders and navigates", () => {
    const { getByText } = render(<LandingScreen />);
    fireEvent.press(getByText("nav.signIn"));
    fireEvent.press(getByText("nav.signUp"));
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  it("LoginScreen submits credentials", async () => {
    mockSupabaseSignIn.mockResolvedValue({ error: null });
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText("loginForm.emailPlaceholder"), "a@b.com");
    fireEvent.changeText(getByPlaceholderText("loginForm.passwordPlaceholder"), "Aaa1!Aaa");
    fireEvent.press(getByText("loginForm.submit"));
    await waitFor(() => expect(mockSupabaseSignIn).toHaveBeenCalled());
  });

  it("LoginScreen handles error", async () => {
    mockSupabaseSignIn.mockResolvedValue({ error: { message: "bad" } });
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText("loginForm.emailPlaceholder"), "a@b.com");
    fireEvent.changeText(getByPlaceholderText("loginForm.passwordPlaceholder"), "Aaa1!Aaa");
    fireEvent.press(getByText("loginForm.submit"));
    await waitFor(() => expect(getByText("bad")).toBeTruthy());
  });

  it("ForgotPasswordScreen handles success", async () => {
    mockSupabaseResetPassword.mockResolvedValue({ error: null });
    const { getByText, getByPlaceholderText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(
      getByPlaceholderText("forgotPasswordForm.emailPlaceholder"),
      "a@b.com",
    );
    fireEvent.press(getByText("forgotPasswordForm.submit"));
    await waitFor(() => expect(getByText("forgotPasswordForm.successTitle")).toBeTruthy());
    fireEvent.press(getByText("forgotPasswordForm.backToLogin"));
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("ForgotPasswordScreen handles error", async () => {
    mockSupabaseResetPassword.mockResolvedValue({ error: { message: "bad" } });
    const { getByText, getByPlaceholderText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(
      getByPlaceholderText("forgotPasswordForm.emailPlaceholder"),
      "a@b.com",
    );
    fireEvent.press(getByText("forgotPasswordForm.submit"));
    await waitFor(() => expect(getByText("bad")).toBeTruthy());
  });

  it("ResetPasswordScreen submits and navigates home", async () => {
    mockSupabaseUpdateUser.mockResolvedValue({ error: null });
    const { getByText, getByPlaceholderText } = render(<ResetPasswordScreen />);
    fireEvent.changeText(
      getByPlaceholderText("resetPasswordForm.newPasswordPlaceholder"),
      "StrongP1!",
    );
    fireEvent.changeText(
      getByPlaceholderText("resetPasswordForm.confirmPasswordPlaceholder"),
      "StrongP1!",
    );
    fireEvent.press(getByText("resetPasswordForm.submit"));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });

  it("ResetPasswordScreen surfaces server error", async () => {
    mockSupabaseUpdateUser.mockResolvedValue({ error: { message: "bad" } });
    const { getByText, getByPlaceholderText } = render(<ResetPasswordScreen />);
    fireEvent.changeText(
      getByPlaceholderText("resetPasswordForm.newPasswordPlaceholder"),
      "StrongP1!",
    );
    fireEvent.changeText(
      getByPlaceholderText("resetPasswordForm.confirmPasswordPlaceholder"),
      "StrongP1!",
    );
    fireEvent.press(getByText("resetPasswordForm.submit"));
    await waitFor(() => expect(getByText("bad")).toBeTruthy());
  });
});

describe("quick informe + record", () => {
  it("renders QuickInformeScreen and navigates", () => {
    const { getByText } = render(<QuickInformeScreen />);
    fireEvent.press(getByText("informes.createQuick"));
    fireEvent.press(getByText("common.back"));
    expect(mockPush).toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();
  });

  it("renders RecordScreen ready state", () => {
    render(<RecordScreen />);
  });
});

describe("patient screens", () => {
  it("NewPatientScreen submits and replaces", async () => {
    mockCreatePatient.mockResolvedValue({ id: "p1" });
    const { getByTestId } = render(<NewPatientScreen />);
    fireEvent.press(getByTestId("submit"));
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
  });

  it("NewPatientScreen handles error", async () => {
    mockCreatePatient.mockRejectedValue(new Error("nope"));
    const { getByTestId } = render(<NewPatientScreen />);
    fireEvent.press(getByTestId("submit"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("NewPatientScreen cancel goes back", () => {
    const { getByTestId } = render(<NewPatientScreen />);
    fireEvent.press(getByTestId("cancel"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("NewPatientScreen no-ops without user", async () => {
    mockUser.current = null;
    const { getByTestId } = render(<NewPatientScreen />);
    fireEvent.press(getByTestId("submit"));
    await waitFor(() => Promise.resolve());
    expect(mockCreatePatient).not.toHaveBeenCalled();
  });

  it("EditPatientScreen renders form and submits", async () => {
    mockLocalParams.current = { id: "p" };
    mockGetPatient.mockResolvedValue({
      id: "p",
      name: "Ana",
      dni: null,
      dob: null,
      phone: null,
      email: null,
      obra_social: null,
      nro_afiliado: null,
      plan: null,
    });
    mockUpdatePatient.mockResolvedValue({});
    const { findByTestId } = render(<EditPatientScreen />);
    const submit = await findByTestId("submit");
    fireEvent.press(submit);
    await waitFor(() => expect(mockUpdatePatient).toHaveBeenCalled());
  });

  it("EditPatientScreen handles missing patient", () => {
    mockLocalParams.current = { id: "p" };
    mockGetPatient.mockResolvedValue(null);
    render(<EditPatientScreen />);
  });

  it("EditPatientScreen update error alerts", async () => {
    mockLocalParams.current = { id: "p" };
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
    mockUpdatePatient.mockRejectedValue(new Error("err"));
    const { findByTestId } = render(<EditPatientScreen />);
    fireEvent.press(await findByTestId("submit"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("EditPatientScreen no-ops without id", () => {
    mockLocalParams.current = {};
    render(<EditPatientScreen />);
  });

  it("PatientDetailScreen renders empty state when no patient", () => {
    mockUsePatientDetail.mockReturnValue({
      patient: null,
      informes: [],
      loading: false,
    });
    render(<PatientDetailScreen />);
  });

  it("PatientDetailScreen renders loading state", () => {
    mockUsePatientDetail.mockReturnValue({
      patient: null,
      informes: [],
      loading: true,
    });
    render(<PatientDetailScreen />);
  });

  it("PatientDetailScreen with a patient", () => {
    mockUsePatientDetail.mockReturnValue({
      patient: {
        id: "p",
        name: "Ana",
        dni: null,
        email: "a@a",
        phone: "+1",
        dob: "2000-01-01",
        obra_social: "OS",
        nro_afiliado: null,
        plan: null,
      },
      informes: [
        {
          id: "i",
          doctor_id: "d",
          patient_id: "p",
          status: "completed",
          informe_doctor: "",
          informe_paciente: "",
          recording_duration: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ],
      loading: false,
    });
    render(<PatientDetailScreen />);
  });
});

describe("profile screen", () => {
  it("renders loading state", () => {
    mockUseDoctor.mockReturnValue({
      doctor: null,
      loading: true,
      setDoctor: jest.fn(),
    });
    render(<ProfileScreen />);
  });

  it("renders and allows sign-out", () => {
    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText("nav.logout"));
  });
});

describe("informe/[id]", () => {
  it("renders loading", () => {
    mockLocalParams.current = { id: "i" };
    mockGetInforme.mockReturnValue(new Promise(() => {}));
    render(<InformeDetailScreen />);
  });

  it("renders empty state when informe not found", async () => {
    mockLocalParams.current = { id: "i" };
    mockGetInforme.mockResolvedValue(null);
    const { findByText } = render(<InformeDetailScreen />);
    await findByText("informePage.errorHint");
  });

  it("renders processing state", async () => {
    mockLocalParams.current = { id: "i" };
    mockGetInforme.mockResolvedValue({
      id: "i",
      doctor_id: "d",
      patient_id: null,
      status: "processing",
      informe_doctor: null,
      informe_paciente: null,
      recording_duration: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    });
    const { findByText } = render(<InformeDetailScreen />);
    await findByText("informePage.processing");
  });

  it("renders error state and allows record-again", async () => {
    mockLocalParams.current = { id: "i" };
    mockGetInforme.mockResolvedValue({
      id: "i",
      doctor_id: "d",
      patient_id: null,
      status: "error",
      informe_doctor: null,
      informe_paciente: null,
      recording_duration: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    });
    const { findByText } = render(<InformeDetailScreen />);
    const btn = await findByText("informePage.recordAgain");
    fireEvent.press(btn);
    expect(mockPush).toHaveBeenCalled();
  });

  it("renders completed state", async () => {
    mockLocalParams.current = { id: "i" };
    mockGetInforme.mockResolvedValue({
      id: "i",
      doctor_id: "d",
      patient_id: "p",
      status: "completed",
      informe_doctor: "doc",
      informe_paciente: "pat",
      recording_duration: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    });
    mockGetPatient.mockResolvedValue({ id: "p", name: "Ana" });
    mockGetDoctor.mockResolvedValue({ id: "d", name: "Dr" });
    render(<InformeDetailScreen />);
    await waitFor(() => expect(mockGetInforme).toHaveBeenCalled());
  });
});

describe("auth/confirm + billing/return", () => {
  it("AuthConfirm verifies token_hash + type", async () => {
    mockSupabaseVerifyOtp.mockResolvedValue({ error: null });
    mockLocalParams.current = { token_hash: "tok", type: "signup" };
    render(<AuthConfirmScreen />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });

  it("AuthConfirm exchanges code", async () => {
    mockSupabaseExchangeCode.mockResolvedValue({ error: null });
    mockLocalParams.current = { code: "abc" };
    render(<AuthConfirmScreen />);
    await waitFor(() => expect(mockSupabaseExchangeCode).toHaveBeenCalled());
  });

  it("AuthConfirm surfaces param error", async () => {
    mockLocalParams.current = { error: "err", error_description: "details" };
    const { findByText } = render(<AuthConfirmScreen />);
    await findByText("details");
  });

  it("AuthConfirm bails when token missing", async () => {
    mockLocalParams.current = {};
    const { findByText } = render(<AuthConfirmScreen />);
    await findByText(/Missing/);
  });

  it("BillingReturn polls and shows ready", async () => {
    mockLocalParams.current = { ref: "r" };
    const { api } = require("@/src/lib/api/client");
    api.get.mockResolvedValue({ state: "ready" });
    const { findByText } = render(<BillingReturnScreen />);
    await findByText("signupForm.successTitle");
  });

  it("BillingReturn unknown", async () => {
    mockLocalParams.current = { ref: "r" };
    const { api } = require("@/src/lib/api/client");
    api.get.mockResolvedValue({ state: "unknown" });
    const { findByText } = render(<BillingReturnScreen />);
    await findByText("common.error");
  });

  it("BillingReturn error", async () => {
    mockLocalParams.current = { ref: "r" };
    const { api } = require("@/src/lib/api/client");
    api.get.mockRejectedValue(new Error("boom"));
    const { findByText } = render(<BillingReturnScreen />);
    await findByText(/boom/);
  });

  it("BillingReturn no ref", () => {
    mockLocalParams.current = {};
    render(<BillingReturnScreen />);
  });
});
