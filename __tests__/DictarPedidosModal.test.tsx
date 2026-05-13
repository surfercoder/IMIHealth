import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

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
    t: (k: string, opts?: { count?: number; patientName?: string }) =>
      opts && (opts.count !== undefined || opts.patientName !== undefined)
        ? `${k}:${JSON.stringify(opts)}`
        : k,
    i18n: { language: "es" },
  }),
}));

const mockAlert = jest.fn();
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  __esModule: true,
  default: { alert: (...a: unknown[]) => mockAlert(...a) },
}));

const mockRecorderStart = jest.fn();
const mockRecorderStop = jest.fn();
const mockRecorderReset = jest.fn();
let mockRecorderPhase: string = "idle";
jest.mock("@/src/hooks/useRecorder", () => ({
  useRecorder: () => ({
    phase: mockRecorderPhase,
    durationMs: 0,
    start: (...a: unknown[]) => mockRecorderStart(...a),
    stop: (...a: unknown[]) => mockRecorderStop(...a),
    reset: (...a: unknown[]) => mockRecorderReset(...a),
  }),
  formatDuration: (ms: number) => `${ms}ms`,
}));

const mockUser = { id: "doc-1" };
jest.mock("@/src/providers/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser }),
}));

const mockCreateInforme = jest.fn();
jest.mock("@/src/lib/api/informes", () => ({
  createInforme: (...a: unknown[]) => mockCreateInforme(...a),
}));

const mockUploadRecording = jest.fn();
jest.mock("@/src/lib/api/audio", () => ({
  uploadRecording: (...a: unknown[]) => mockUploadRecording(...a),
}));

const mockTranscribeAudio = jest.fn();
jest.mock("@/src/lib/api/transcribe", () => ({
  transcribeAudio: (...a: unknown[]) => mockTranscribeAudio(...a),
}));

const mockSharePdf = jest.fn();
jest.mock("@/src/lib/api/pdf", () => ({
  sharePdf: (...a: unknown[]) => mockSharePdf(...a),
}));

const mockSendPedidosPatient = jest.fn();
jest.mock("@/src/lib/api/whatsapp", () => ({
  sendPedidosPatientWhatsApp: (...a: unknown[]) => mockSendPedidosPatient(...a),
}));

import { DictarPedidosModal } from "@/src/components/DictarPedidosModal";

beforeEach(() => {
  mockAlert.mockReset();
  mockRecorderStart.mockReset();
  mockRecorderStop.mockReset();
  mockRecorderReset.mockReset();
  mockCreateInforme.mockReset();
  mockUploadRecording.mockReset();
  mockTranscribeAudio.mockReset();
  mockSharePdf.mockReset();
  mockSendPedidosPatient.mockReset();
  mockRecorderPhase = "idle";
});

function renderModal(overrides: Partial<React.ComponentProps<typeof DictarPedidosModal>> = {}) {
  return render(
    <DictarPedidosModal
      visible
      onClose={overrides.onClose ?? jest.fn()}
      patientId={overrides.patientId ?? "pat-1"}
      patientName={overrides.patientName ?? "Jane"}
      patientPhone={"patientPhone" in overrides ? overrides.patientPhone! : "+5491111"}
    />,
  );
}

describe("DictarPedidosModal", () => {
  it("renders idle instructions", () => {
    const { getByText } = renderModal();
    expect(getByText("dictarPedidos.title")).toBeTruthy();
    expect(getByText("dictarPedidos.howItWorks")).toBeTruthy();
    expect(getByText("dictarPedidos.step1")).toBeTruthy();
  });

  it("starts recording when start pressed", () => {
    const { getByLabelText } = renderModal();
    fireEvent.press(getByLabelText("dictarPedidos.btnStart"));
    expect(mockRecorderStart).toHaveBeenCalled();
  });

  it("alerts when start throws", async () => {
    mockRecorderStart.mockRejectedValueOnce(new Error("denied"));
    const { getByLabelText } = renderModal();
    fireEvent.press(getByLabelText("dictarPedidos.btnStart"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("full flow: record → upload → transcribe → review → generate → success", async () => {
    mockRecorderStop.mockResolvedValue({ uri: "file://r.m4a", durationMs: 1 });
    mockCreateInforme.mockResolvedValue({ id: "inf-1" });
    mockUploadRecording.mockResolvedValue("doc/inf/recording.m4a");
    mockTranscribeAudio.mockResolvedValue(
      "Solicito hemograma. Solicito orina. Diagnostico lumbalgia",
    );
    mockSharePdf.mockResolvedValue(undefined);
    mockRecorderPhase = "recording";

    const { getByLabelText, getByText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStop"));
    });
    await waitFor(() => expect(mockTranscribeAudio).toHaveBeenCalled());
    await waitFor(() =>
      expect(getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );

    await act(async () => {
      fireEvent.press(getByText(/^dictarPedidos\.generate:/));
    });
    await waitFor(() =>
      expect(mockSharePdf).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "pedidos-patient",
          patientId: "pat-1",
          items: ["hemograma", "orina"],
          diagnostico: "lumbalgia",
        }),
      ),
    );
    await waitFor(() =>
      expect(getByText("dictarPedidos.successMessage")).toBeTruthy(),
    );
  });

  it("alerts when stop produces no URI", async () => {
    mockRecorderStop.mockResolvedValue({ uri: null, durationMs: 0 });
    mockRecorderPhase = "recording";
    const { getByLabelText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStop"));
    });
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
    expect(mockRecorderReset).toHaveBeenCalled();
  });

  it("alerts when upload throws", async () => {
    mockRecorderStop.mockResolvedValue({ uri: "file://r.m4a", durationMs: 1 });
    mockCreateInforme.mockResolvedValue({ id: "inf-1" });
    mockUploadRecording.mockRejectedValue(new Error("nope"));
    mockRecorderPhase = "recording";

    const { getByLabelText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStop"));
    });
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("recovers to review when generate PDF fails", async () => {
    mockRecorderStop.mockResolvedValue({ uri: "file://r.m4a", durationMs: 1 });
    mockCreateInforme.mockResolvedValue({ id: "inf-1" });
    mockUploadRecording.mockResolvedValue("p");
    mockTranscribeAudio.mockResolvedValue("Solicito X");
    mockSharePdf.mockRejectedValueOnce(new Error("pdf fail"));
    mockRecorderPhase = "recording";

    const { getByLabelText, getByText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStop"));
    });
    await waitFor(() =>
      expect(getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );

    await act(async () => {
      fireEvent.press(getByText(/^dictarPedidos\.generate:/));
    });
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
    expect(getByText("dictarPedidos.itemsLabel")).toBeTruthy();
  });

  it("recordAgain returns to idle and resets recorder", async () => {
    mockRecorderStop.mockResolvedValue({ uri: "file://r.m4a", durationMs: 1 });
    mockCreateInforme.mockResolvedValue({ id: "inf-1" });
    mockUploadRecording.mockResolvedValue("p");
    mockTranscribeAudio.mockResolvedValue("Solicito X");
    mockRecorderPhase = "recording";

    const { getByLabelText, getByText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStop"));
    });
    await waitFor(() =>
      expect(getByText("dictarPedidos.recordAgain")).toBeTruthy(),
    );
    fireEvent.press(getByText("dictarPedidos.recordAgain"));
    expect(mockRecorderReset).toHaveBeenCalled();
  });

  it("close button triggers onClose and resets recorder", () => {
    const onClose = jest.fn();
    const { getByLabelText } = renderModal({ onClose });
    fireEvent.press(getByLabelText("common.cancel"));
    expect(onClose).toHaveBeenCalled();
    expect(mockRecorderReset).toHaveBeenCalled();
  });

  it("close while recording stops recorder", () => {
    const onClose = jest.fn();
    mockRecorderStop.mockResolvedValue({ uri: null, durationMs: 0 });
    mockRecorderPhase = "recording";
    const { getByLabelText } = renderModal({ onClose });
    fireEvent.press(getByLabelText("common.cancel"));
    expect(mockRecorderStop).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("success step: view PDF button calls sharePdf again", async () => {
    mockRecorderStop.mockResolvedValue({ uri: "file://r.m4a", durationMs: 1 });
    mockCreateInforme.mockResolvedValue({ id: "inf-1" });
    mockUploadRecording.mockResolvedValue("p");
    mockTranscribeAudio.mockResolvedValue("Solicito hemograma");
    mockSharePdf.mockResolvedValue(undefined);
    mockRecorderPhase = "recording";

    const { getByLabelText, getByText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStop"));
    });
    await waitFor(() =>
      expect(getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(getByText(/^dictarPedidos\.generate:/));
    });
    await waitFor(() =>
      expect(getByText("dictarPedidos.successMessage")).toBeTruthy(),
    );

    mockSharePdf.mockClear();
    await act(async () => {
      fireEvent.press(getByText("dictarPedidos.viewOnline"));
    });
    await waitFor(() => expect(mockSharePdf).toHaveBeenCalled());
  });

  it("success step: view PDF alerts on failure", async () => {
    mockRecorderStop.mockResolvedValue({ uri: "file://r.m4a", durationMs: 1 });
    mockCreateInforme.mockResolvedValue({ id: "inf-1" });
    mockUploadRecording.mockResolvedValue("p");
    mockTranscribeAudio.mockResolvedValue("Solicito hemograma");
    mockSharePdf.mockResolvedValueOnce(undefined);
    mockRecorderPhase = "recording";

    const { getByLabelText, getByText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStop"));
    });
    await act(async () => {
      fireEvent.press(getByText(/^dictarPedidos\.generate:/));
    });
    await waitFor(() =>
      expect(getByText("dictarPedidos.successMessage")).toBeTruthy(),
    );
    mockSharePdf.mockRejectedValueOnce(new Error("boom"));
    await act(async () => {
      fireEvent.press(getByText("dictarPedidos.viewOnline"));
    });
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("success step: WhatsApp success / failure / exception paths", async () => {
    mockRecorderStop.mockResolvedValue({ uri: "file://r.m4a", durationMs: 1 });
    mockCreateInforme.mockResolvedValue({ id: "inf-1" });
    mockUploadRecording.mockResolvedValue("p");
    mockTranscribeAudio.mockResolvedValue("Solicito hemograma");
    mockSharePdf.mockResolvedValue(undefined);
    mockRecorderPhase = "recording";

    const { getByLabelText, getByText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStop"));
    });
    await act(async () => {
      fireEvent.press(getByText(/^dictarPedidos\.generate:/));
    });
    await waitFor(() =>
      expect(getByText("whatsappPedidosButton.label")).toBeTruthy(),
    );

    mockSendPedidosPatient.mockResolvedValueOnce({ success: true });
    await act(async () => {
      fireEvent.press(getByText("whatsappPedidosButton.label"));
    });
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());

    mockSendPedidosPatient.mockResolvedValueOnce({ success: false, error: "x" });
    await act(async () => {
      fireEvent.press(getByText("whatsappPedidosButton.label"));
    });
    await waitFor(() => expect(mockAlert.mock.calls.length).toBeGreaterThan(1));

    mockSendPedidosPatient.mockResolvedValueOnce({ success: false });
    await act(async () => {
      fireEvent.press(getByText("whatsappPedidosButton.label"));
    });
    await waitFor(() => expect(mockAlert.mock.calls.length).toBeGreaterThan(2));

    mockSendPedidosPatient.mockRejectedValueOnce(new Error("net"));
    await act(async () => {
      fireEvent.press(getByText("whatsappPedidosButton.label"));
    });
    await waitFor(() => expect(mockAlert.mock.calls.length).toBeGreaterThan(3));

    mockSendPedidosPatient.mockRejectedValueOnce("plain");
    await act(async () => {
      fireEvent.press(getByText("whatsappPedidosButton.label"));
    });
    await waitFor(() => expect(mockAlert.mock.calls.length).toBeGreaterThan(4));
  });

  it("success step without phone hides WhatsApp button", async () => {
    mockRecorderStop.mockResolvedValue({ uri: "file://r.m4a", durationMs: 1 });
    mockCreateInforme.mockResolvedValue({ id: "inf-1" });
    mockUploadRecording.mockResolvedValue("p");
    mockTranscribeAudio.mockResolvedValue("Solicito hemograma");
    mockSharePdf.mockResolvedValue(undefined);
    mockRecorderPhase = "recording";

    const { getByLabelText, getByText, queryByText } = renderModal({
      patientPhone: null,
    });
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStop"));
    });
    await act(async () => {
      fireEvent.press(getByText(/^dictarPedidos\.generate:/));
    });
    await waitFor(() =>
      expect(getByText("dictarPedidos.successMessage")).toBeTruthy(),
    );
    expect(queryByText("whatsappPedidosButton.label")).toBeNull();
  });

  it("generateAnother returns to idle", async () => {
    mockRecorderStop.mockResolvedValue({ uri: "file://r.m4a", durationMs: 1 });
    mockCreateInforme.mockResolvedValue({ id: "inf-1" });
    mockUploadRecording.mockResolvedValue("p");
    mockTranscribeAudio.mockResolvedValue("Solicito hemograma");
    mockSharePdf.mockResolvedValue(undefined);
    mockRecorderPhase = "recording";

    const { getByLabelText, getByText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStop"));
    });
    await act(async () => {
      fireEvent.press(getByText(/^dictarPedidos\.generate:/));
    });
    await waitFor(() =>
      expect(getByText("dictarPedidos.generateAnother")).toBeTruthy(),
    );
    fireEvent.press(getByText("dictarPedidos.generateAnother"));
    expect(mockRecorderReset).toHaveBeenCalled();
  });

  it("editing detected items updates the count in the generate label", async () => {
    mockRecorderStop.mockResolvedValue({ uri: "file://r.m4a", durationMs: 1 });
    mockCreateInforme.mockResolvedValue({ id: "inf-1" });
    mockUploadRecording.mockResolvedValue("p");
    mockTranscribeAudio.mockResolvedValue("Solicito A");
    mockRecorderPhase = "recording";

    const { getByLabelText, getByPlaceholderText, getByText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStop"));
    });
    await waitFor(() =>
      expect(getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );
    fireEvent.changeText(
      getByPlaceholderText("dictarPedidos.itemsPlaceholder"),
      "- A\n- B\n- C",
    );
    expect(getByText(/dictarPedidos\.generate:.*"count":3/)).toBeTruthy();
  });

  it("editing the diagnostico field updates the value", async () => {
    mockRecorderStop.mockResolvedValue({ uri: "file://r.m4a", durationMs: 1 });
    mockCreateInforme.mockResolvedValue({ id: "inf-1" });
    mockUploadRecording.mockResolvedValue("p");
    mockTranscribeAudio.mockResolvedValue("Solicito A");
    mockSharePdf.mockResolvedValue(undefined);
    mockRecorderPhase = "recording";

    const { getByLabelText, getByPlaceholderText, getByText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStop"));
    });
    await waitFor(() =>
      expect(getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );
    fireEvent.changeText(
      getByPlaceholderText("dictarPedidos.diagnosticoPlaceholder"),
      "lumbalgia",
    );
    await act(async () => {
      fireEvent.press(getByText(/^dictarPedidos\.generate:/));
    });
    await waitFor(() =>
      expect(mockSharePdf).toHaveBeenCalledWith(
        expect.objectContaining({ diagnostico: "lumbalgia" }),
      ),
    );
  });
});
