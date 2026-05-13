import { render } from "@testing-library/react-native";

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
  }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Stack: { Screen: () => null },
}));

jest.mock("@/src/components/AppHeader", () => ({ AppHeader: () => null }));
jest.mock("@/src/components/LanguageSwitcher", () => ({ LanguageSwitcher: () => null }));
jest.mock("@/src/components/SignaturePad", () => ({ SignaturePad: () => null }));

jest.mock("@/src/providers/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "u", email: "u@u.com" } }),
}));

const mockUseDoctor = jest.fn();
jest.mock("@/src/hooks/useDoctor", () => ({
  useDoctor: () => mockUseDoctor(),
}));

jest.mock("@/src/hooks/useCheckout", () => ({
  useCheckout: () => ({ upgradeExisting: jest.fn(), signupPro: jest.fn() }),
}));

jest.mock("@/src/lib/api/doctors", () => ({ updateDoctor: jest.fn() }));
jest.mock("@/src/lib/authTransitions", () => ({ triggerGoodbye: jest.fn() }));

jest.mock("@/src/lib/supabase", () => ({
  supabase: { auth: { getSession: jest.fn() } },
}));
jest.mock("@/src/lib/api/informes", () => ({
  createInforme: jest.fn(),
  processInforme: jest.fn(),
}));
jest.mock("@/src/lib/api/audio", () => ({ uploadRecording: jest.fn() }));
jest.mock("@/src/lib/api/client", () => ({
  api: { post: jest.fn() },
  ApiError: class ApiError extends Error {},
}));
jest.mock("@/src/components/RecorderControls", () => ({
  RecorderControls: () => null,
}));

const mockUseRecorder = jest.fn();
jest.mock("@/src/hooks/useRecorder", () => ({
  useRecorder: () => mockUseRecorder(),
  formatDuration: () => "00:00",
}));

import ProfileScreen from "@/app/(app)/profile";
import RecordScreen from "@/app/(app)/record";

describe("ProfileScreen optional row branches", () => {
  it("renders doctor with all optional fields populated", () => {
    mockUseDoctor.mockReturnValue({
      doctor: {
        id: "d",
        name: "Dr",
        email: "d@d",
        phone: "+1",
        matricula: "M",
        especialidad: "Cardiología",
        dni: "12345678",
        tagline: "tag",
      },
      loading: false,
      setDoctor: jest.fn(),
    });
    render(<ProfileScreen />);
  });

  it("renders doctor with no dni and no tagline", () => {
    mockUseDoctor.mockReturnValue({
      doctor: {
        id: "d",
        name: "Dr",
        email: "d@d",
        phone: "+1",
        matricula: "M",
        especialidad: null,
        dni: null,
        tagline: null,
      },
      loading: false,
      setDoctor: jest.fn(),
    });
    render(<ProfileScreen />);
  });
});

describe("RecordScreen recording-phase Text branch", () => {
  it("shows the recording label when phase=recording", () => {
    mockUseRecorder.mockReturnValue({
      phase: "recording",
      durationMs: 30_000,
      isRecording: true,
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    });
    const { getByText } = render(<RecordScreen />);
    expect(getByText("audioRecorder.stateRecording")).toBeTruthy();
  });
});
