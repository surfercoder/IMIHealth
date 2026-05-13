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

const mockI18nLanguage: { current: string | undefined } = { current: "es-AR" };
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? k,
    i18n: { language: mockI18nLanguage.current },
  }),
}));

const mockReplace = jest.fn();
const mockLocalParams: { current: Record<string, unknown> } = { current: {} };
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: mockReplace }),
  useLocalSearchParams: () => mockLocalParams.current,
  Stack: { Screen: () => null },
}));

const mockStop = jest.fn();
const mockStart = jest.fn();
const mockReset = jest.fn();
const mockRecorderState = {
  phase: "idle" as const,
  durationMs: 30_000,
  isRecording: false,
  start: mockStart,
  stop: mockStop,
  reset: mockReset,
};
jest.mock("@/src/hooks/useRecorder", () => ({
  useRecorder: () => mockRecorderState,
  formatDuration: () => "00:00",
}));

jest.mock("@/src/providers/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "u" } }),
}));

const mockCreateInforme = jest.fn();
const mockProcessInforme = jest.fn();
jest.mock("@/src/lib/api/informes", () => ({
  createInforme: (...a: unknown[]) => mockCreateInforme(...a),
  processInforme: (...a: unknown[]) => mockProcessInforme(...a),
}));

const mockUploadRecording = jest.fn();
jest.mock("@/src/lib/api/audio", () => ({
  uploadRecording: (...a: unknown[]) => mockUploadRecording(...a),
}));

jest.mock("@/src/lib/api/client", () => {
  class MockApiErrorImpl extends Error {
    status = 0;
  }
  return {
    api: { get: jest.fn(), post: jest.fn() },
    ApiError: MockApiErrorImpl,
  };
});
const mockApiErrorClass = require("@/src/lib/api/client").ApiError;

jest.mock("@/src/components/RecorderControls", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    RecorderControls: (p: { onStop: () => void }) =>
      React.createElement(RN.Text, { testID: "stop", onPress: p.onStop }, "stop"),
  };
});

import RecordScreen from "@/app/(app)/record";

beforeEach(() => {
  mockReplace.mockReset();
  mockStop.mockReset();
  mockCreateInforme.mockReset();
  mockProcessInforme.mockReset();
  mockUploadRecording.mockReset();
  mockI18nLanguage.current = "es-AR";
  mockLocalParams.current = {};
});

describe("RecordScreen branches", () => {
  it("classic mode passes patientId to createInforme", async () => {
    mockLocalParams.current = { mode: "classic", patientId: "patient-1" };
    mockStop.mockResolvedValue({ uri: "f", durationMs: 30_000 });
    mockCreateInforme.mockResolvedValue({ id: "i" });
    mockUploadRecording.mockResolvedValue("path");
    mockProcessInforme.mockResolvedValue({ success: true });
    const { getByTestId } = render(<RecordScreen />);
    fireEvent.press(getByTestId("stop"));
    await waitFor(() => expect(mockCreateInforme).toHaveBeenCalled());
    expect(mockCreateInforme).toHaveBeenCalledWith("u", "patient-1");
  });

  it("language parsing handles bare codes and missing language", async () => {
    mockI18nLanguage.current = undefined;
    mockLocalParams.current = { mode: "quick" };
    mockStop.mockResolvedValue({ uri: "f", durationMs: 30_000 });
    mockCreateInforme.mockResolvedValue({ id: "i" });
    mockUploadRecording.mockResolvedValue("path");
    mockProcessInforme.mockResolvedValue({ success: true });
    const { getByTestId } = render(<RecordScreen />);
    fireEvent.press(getByTestId("stop"));
    await waitFor(() => expect(mockProcessInforme).toHaveBeenCalled());
    expect(mockProcessInforme.mock.calls[0][0].language).toBe("es");
  });

  it("catches ApiError thrown from createInforme", async () => {
    mockStop.mockResolvedValue({ uri: "f", durationMs: 30_000 });
    mockCreateInforme.mockRejectedValue(new mockApiErrorClass("api err"));
    const { getByTestId, findByText } = render(<RecordScreen />);
    fireEvent.press(getByTestId("stop"));
    await findByText("informePage.recordAgain");
  });

  it("catches non-Error throws with String() fallback (from createInforme)", async () => {
    mockStop.mockResolvedValue({ uri: "f", durationMs: 30_000 });
    mockCreateInforme.mockRejectedValue("string thrown value");
    const { getByTestId, findByText } = render(<RecordScreen />);
    fireEvent.press(getByTestId("stop"));
    await findByText("informePage.recordAgain");
  });

  it("renders the uploading state while createInforme is in flight", async () => {
    mockStop.mockResolvedValue({ uri: "f", durationMs: 30_000 });
    let resolveCreate!: (v: { id: string }) => void;
    mockCreateInforme.mockImplementation(
      () => new Promise((r) => { resolveCreate = r; }),
    );
    mockUploadRecording.mockResolvedValue("path");
    mockProcessInforme.mockResolvedValue({ success: true });
    const { getByTestId, findByText } = render(<RecordScreen />);
    fireEvent.press(getByTestId("stop"));
    await findByText("audioRecorder.stateUploading");
    resolveCreate({ id: "i" });
    await waitFor(() => expect(mockProcessInforme).toHaveBeenCalled());
  });

  it("renders the processing state while processInforme is in flight", async () => {
    mockStop.mockResolvedValue({ uri: "f", durationMs: 30_000 });
    mockCreateInforme.mockResolvedValue({ id: "i" });
    mockUploadRecording.mockResolvedValue("path");
    let resolveProcess!: (v: { success: boolean }) => void;
    mockProcessInforme.mockImplementation(
      () => new Promise((r) => { resolveProcess = r; }),
    );
    const { getByTestId, findByText } = render(<RecordScreen />);
    fireEvent.press(getByTestId("stop"));
    await findByText("audioRecorder.stateProcessing");
    resolveProcess({ success: true });
    await waitFor(() => expect(mockProcessInforme).toHaveBeenCalled());
  });
});
