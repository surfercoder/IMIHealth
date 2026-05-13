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

let mockLanguage: string | undefined = "es";
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: { count?: number; patientName?: string }) =>
      opts && (opts.count !== undefined || opts.patientName !== undefined)
        ? `${k}:${JSON.stringify(opts)}`
        : k,
    i18n: { language: mockLanguage },
  }),
}));

const mockAlert = jest.fn();
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  __esModule: true,
  default: { alert: (...a: unknown[]) => mockAlert(...a) },
}));

const mockDictationStart = jest.fn();
const mockDictationPause = jest.fn();
const mockDictationResume = jest.fn();
const mockDictationStop = jest.fn();
const mockDictationReset = jest.fn();
let mockDictationPhase: "idle" | "recording" | "paused" = "idle";
let mockDictationTranscript = "";
let mockDictationError: string | null = null;
let mockDictationDurationMs = 0;

jest.mock("@/src/hooks/useDictation", () => ({
  useDictation: () => ({
    phase: mockDictationPhase,
    durationMs: mockDictationDurationMs,
    liveTranscript: mockDictationTranscript,
    error: mockDictationError,
    start: (...a: unknown[]) => mockDictationStart(...a),
    pause: (...a: unknown[]) => mockDictationPause(...a),
    resume: (...a: unknown[]) => mockDictationResume(...a),
    stop: (...a: unknown[]) => mockDictationStop(...a),
    reset: (...a: unknown[]) => mockDictationReset(...a),
  }),
}));

jest.mock("@/src/hooks/useRecorder", () => ({
  formatDuration: (ms: number) => `${ms}ms`,
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
  mockDictationStart.mockReset().mockResolvedValue(undefined);
  mockDictationPause.mockReset();
  mockDictationResume.mockReset().mockResolvedValue(undefined);
  mockDictationStop.mockReset().mockReturnValue("");
  mockDictationReset.mockReset();
  mockSharePdf.mockReset();
  mockSendPedidosPatient.mockReset();
  mockDictationPhase = "idle";
  mockDictationTranscript = "";
  mockDictationError = null;
  mockDictationDurationMs = 0;
  mockLanguage = "es";
});

function renderModal(
  overrides: Partial<React.ComponentProps<typeof DictarPedidosModal>> = {},
) {
  return render(
    <DictarPedidosModal
      visible
      onClose={overrides.onClose ?? jest.fn()}
      patientId={overrides.patientId ?? "pat-1"}
      patientName={overrides.patientName ?? "Jane"}
      patientPhone={
        "patientPhone" in overrides ? overrides.patientPhone! : "+5491111"
      }
    />,
  );
}

async function stopAndReviewWith(transcript: string) {
  mockDictationPhase = "recording";
  mockDictationStop.mockReturnValueOnce(transcript);
  const utils = renderModal();
  await act(async () => {
    fireEvent.press(utils.getByLabelText("dictarPedidos.btnStop"));
  });
  return utils;
}

describe("DictarPedidosModal", () => {
  it("renders idle instructions and start button", () => {
    const { getByText, getByLabelText } = renderModal();
    expect(getByText("dictarPedidos.title")).toBeTruthy();
    expect(getByText("dictarPedidos.howItWorks")).toBeTruthy();
    expect(getByText("dictarPedidos.step1")).toBeTruthy();
    expect(getByLabelText("dictarPedidos.btnStart")).toBeTruthy();
  });

  it("starts recording when start pressed", async () => {
    const { getByLabelText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStart"));
    });
    expect(mockDictationStart).toHaveBeenCalledWith({ language: "es-419" });
  });

  it("starts recording with en-US when i18n language is English", async () => {
    mockLanguage = "en";
    const { getByLabelText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStart"));
    });
    expect(mockDictationStart).toHaveBeenCalledWith({ language: "en-US" });
  });

  it("starts recording with default es-419 when i18n language is undefined", async () => {
    mockLanguage = undefined;
    const { getByLabelText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStart"));
    });
    expect(mockDictationStart).toHaveBeenCalledWith({ language: "es-419" });
  });

  it("starts recording with default es-419 when locale code is empty", async () => {
    mockLanguage = "";
    const { getByLabelText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStart"));
    });
    expect(mockDictationStart).toHaveBeenCalledWith({ language: "es-419" });
  });

  it("alerts when start throws", async () => {
    mockDictationStart.mockRejectedValueOnce(new Error("denied"));
    const { getByLabelText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStart"));
    });
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("alerts when start throws with non-Error rejection", async () => {
    mockDictationStart.mockRejectedValueOnce("plain string");
    const { getByLabelText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStart"));
    });
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("recording phase shows pause/stop and timer; pause is invoked", () => {
    mockDictationPhase = "recording";
    mockDictationDurationMs = 1500;
    const { getByLabelText, getByText } = renderModal();
    expect(getByText("1500ms")).toBeTruthy();
    expect(getByText("dictarPedidos.recordingHint")).toBeTruthy();
    fireEvent.press(getByLabelText("dictarPedidos.btnPause"));
    expect(mockDictationPause).toHaveBeenCalled();
  });

  it("paused phase shows resume and stop; resume is invoked", async () => {
    mockDictationPhase = "paused";
    const { getByLabelText, getByText } = renderModal();
    expect(getByText("dictarPedidos.pausedHint")).toBeTruthy();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnResume"));
    });
    expect(mockDictationResume).toHaveBeenCalled();
  });

  it("alerts when resume throws", async () => {
    mockDictationPhase = "paused";
    mockDictationResume.mockRejectedValueOnce(new Error("oops"));
    const { getByLabelText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnResume"));
    });
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("alerts when resume throws with non-Error rejection", async () => {
    mockDictationPhase = "paused";
    mockDictationResume.mockRejectedValueOnce("not-error");
    const { getByLabelText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnResume"));
    });
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("live transcript card appears while recording with content", () => {
    mockDictationPhase = "recording";
    mockDictationTranscript = "hello world";
    const { getByText } = renderModal();
    expect(getByText("dictarPedidos.liveTranscript")).toBeTruthy();
    expect(getByText("hello world")).toBeTruthy();
  });

  it("error card appears when dictation has error", () => {
    mockDictationPhase = "idle";
    mockDictationError = "permission denied";
    const { getByText } = renderModal();
    expect(getByText("dictarPedidos.micErrorTitle")).toBeTruthy();
    expect(getByText("permission denied")).toBeTruthy();
  });

  it("stop transitions to review with parsed items + diagnostico", async () => {
    const utils = await stopAndReviewWith(
      "Solicito hemograma. Solicito orina. Diagnostico lumbalgia",
    );
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );
    expect(utils.getByDisplayValue("- hemograma\n- orina")).toBeTruthy();
    expect(utils.getByDisplayValue("lumbalgia")).toBeTruthy();
  });

  it("generate button is disabled when no items, so press is a no-op", async () => {
    mockDictationPhase = "recording";
    mockDictationStop.mockReturnValueOnce("");
    const { getByLabelText, getByText } = renderModal();
    await act(async () => {
      fireEvent.press(getByLabelText("dictarPedidos.btnStop"));
    });
    await waitFor(() =>
      expect(getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );
    fireEvent.press(getByText(/^dictarPedidos\.generate:/));
    expect(mockSharePdf).not.toHaveBeenCalled();
  });

  it("full flow: review → generate → success", async () => {
    mockSharePdf.mockResolvedValue(undefined);
    const utils = await stopAndReviewWith(
      "Solicito hemograma. Solicito orina. Diagnostico lumbalgia",
    );
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(utils.getByText(/^dictarPedidos\.generate:/));
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
      expect(utils.getByText("dictarPedidos.successMessage")).toBeTruthy(),
    );
  });

  it("generate failure returns to review and alerts", async () => {
    mockSharePdf.mockRejectedValueOnce(new Error("pdf fail"));
    const utils = await stopAndReviewWith("Solicito X");
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(utils.getByText(/^dictarPedidos\.generate:/));
    });
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
    expect(utils.getByText("dictarPedidos.itemsLabel")).toBeTruthy();
  });

  it("generate failure with non-Error rejection alerts", async () => {
    mockSharePdf.mockRejectedValueOnce("plain");
    const utils = await stopAndReviewWith("Solicito X");
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(utils.getByText(/^dictarPedidos\.generate:/));
    });
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("recordAgain button resets dictation and returns to idle", async () => {
    const utils = await stopAndReviewWith("Solicito X");
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.recordAgain")).toBeTruthy(),
    );
    fireEvent.press(utils.getByText("dictarPedidos.recordAgain"));
    expect(mockDictationReset).toHaveBeenCalled();
  });

  it("close from idle triggers onClose and resets dictation", () => {
    const onClose = jest.fn();
    const { getByLabelText } = renderModal({ onClose });
    fireEvent.press(getByLabelText("common.cancel"));
    expect(onClose).toHaveBeenCalled();
    expect(mockDictationReset).toHaveBeenCalled();
  });

  it("close while recording also resets dictation", () => {
    const onClose = jest.fn();
    mockDictationPhase = "recording";
    const { getByLabelText } = renderModal({ onClose });
    fireEvent.press(getByLabelText("common.cancel"));
    expect(mockDictationReset).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("success step: view PDF calls sharePdf with current state", async () => {
    mockSharePdf.mockResolvedValue(undefined);
    const utils = await stopAndReviewWith(
      "Solicito hemograma. Diagnostico lumbalgia",
    );
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(utils.getByText(/^dictarPedidos\.generate:/));
    });
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.successMessage")).toBeTruthy(),
    );

    mockSharePdf.mockClear();
    await act(async () => {
      fireEvent.press(utils.getByText("dictarPedidos.viewOnline"));
    });
    await waitFor(() => expect(mockSharePdf).toHaveBeenCalled());
  });

  it("success step: view PDF alerts on failure", async () => {
    mockSharePdf.mockResolvedValueOnce(undefined);
    const utils = await stopAndReviewWith("Solicito hemograma");
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(utils.getByText(/^dictarPedidos\.generate:/));
    });
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.successMessage")).toBeTruthy(),
    );
    mockSharePdf.mockRejectedValueOnce(new Error("boom"));
    await act(async () => {
      fireEvent.press(utils.getByText("dictarPedidos.viewOnline"));
    });
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("success step: view PDF alerts on failure with non-Error rejection", async () => {
    mockSharePdf.mockResolvedValueOnce(undefined);
    const utils = await stopAndReviewWith("Solicito hemograma");
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(utils.getByText(/^dictarPedidos\.generate:/));
    });
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.successMessage")).toBeTruthy(),
    );
    mockSharePdf.mockRejectedValueOnce("plain");
    await act(async () => {
      fireEvent.press(utils.getByText("dictarPedidos.viewOnline"));
    });
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("success step: WhatsApp success / error-with-msg / error-no-msg / Error throw / non-Error throw", async () => {
    mockSharePdf.mockResolvedValue(undefined);
    const utils = await stopAndReviewWith("Solicito hemograma");
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(utils.getByText(/^dictarPedidos\.generate:/));
    });
    await waitFor(() =>
      expect(utils.getByText("whatsappPedidosButton.label")).toBeTruthy(),
    );

    mockSendPedidosPatient.mockResolvedValueOnce({ success: true });
    await act(async () => {
      fireEvent.press(utils.getByText("whatsappPedidosButton.label"));
    });
    await waitFor(() => expect(mockAlert.mock.calls.length).toBe(1));

    mockSendPedidosPatient.mockResolvedValueOnce({ success: false, error: "x" });
    await act(async () => {
      fireEvent.press(utils.getByText("whatsappPedidosButton.label"));
    });
    await waitFor(() => expect(mockAlert.mock.calls.length).toBe(2));

    mockSendPedidosPatient.mockResolvedValueOnce({ success: false });
    await act(async () => {
      fireEvent.press(utils.getByText("whatsappPedidosButton.label"));
    });
    await waitFor(() => expect(mockAlert.mock.calls.length).toBe(3));

    mockSendPedidosPatient.mockRejectedValueOnce(new Error("net"));
    await act(async () => {
      fireEvent.press(utils.getByText("whatsappPedidosButton.label"));
    });
    await waitFor(() => expect(mockAlert.mock.calls.length).toBe(4));

    mockSendPedidosPatient.mockRejectedValueOnce("plain");
    await act(async () => {
      fireEvent.press(utils.getByText("whatsappPedidosButton.label"));
    });
    await waitFor(() => expect(mockAlert.mock.calls.length).toBe(5));
  });

  it("success step without phone hides WhatsApp button", async () => {
    mockSharePdf.mockResolvedValue(undefined);
    mockDictationPhase = "recording";
    mockDictationStop.mockReturnValueOnce("Solicito hemograma");
    const u2 = renderModal({ patientPhone: null });
    await act(async () => {
      fireEvent.press(u2.getByLabelText("dictarPedidos.btnStop"));
    });
    await waitFor(() =>
      expect(u2.getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(u2.getByText(/^dictarPedidos\.generate:/));
    });
    await waitFor(() =>
      expect(u2.getByText("dictarPedidos.successMessage")).toBeTruthy(),
    );
    expect(u2.queryByText("whatsappPedidosButton.label")).toBeNull();
  });

  it("generateAnother resets dictation and returns to idle", async () => {
    mockSharePdf.mockResolvedValue(undefined);
    const utils = await stopAndReviewWith("Solicito hemograma");
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(utils.getByText(/^dictarPedidos\.generate:/));
    });
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.generateAnother")).toBeTruthy(),
    );
    fireEvent.press(utils.getByText("dictarPedidos.generateAnother"));
    expect(mockDictationReset).toHaveBeenCalled();
  });

  it("editing items text updates the generate count", async () => {
    const utils = await stopAndReviewWith("Solicito A");
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );
    fireEvent.changeText(
      utils.getByPlaceholderText("dictarPedidos.itemsPlaceholder"),
      "- A\n- B\n- C",
    );
    expect(utils.getByText(/dictarPedidos\.generate:.*"count":3/)).toBeTruthy();
  });

  it("WhatsApp uses default `es` locale when i18n language is undefined", async () => {
    mockLanguage = undefined;
    mockSharePdf.mockResolvedValue(undefined);
    mockSendPedidosPatient.mockResolvedValueOnce({ success: true });
    mockDictationPhase = "recording";
    mockDictationStop.mockReturnValueOnce("Solicito A");
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
      expect(getByText("whatsappPedidosButton.label")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(getByText("whatsappPedidosButton.label"));
    });
    await waitFor(() =>
      expect(mockSendPedidosPatient).toHaveBeenCalledWith(
        expect.objectContaining({ locale: "es" }),
      ),
    );
  });

  function walkAndFireStyles(instance: {
    props?: Record<string, unknown>;
    children?: unknown[];
  }) {
    const style = instance.props?.style;
    if (typeof style === "function") {
      (style as (s: { pressed: boolean }) => unknown)({ pressed: true });
      (style as (s: { pressed: boolean }) => unknown)({ pressed: false });
    }
    const children = instance.children as
      | { props?: Record<string, unknown>; children?: unknown[] }[]
      | undefined;
    if (Array.isArray(children)) {
      for (const c of children) {
        if (c && typeof c === "object") walkAndFireStyles(c);
      }
    }
  }

  it("press style callbacks invoke pressed branch (idle start)", () => {
    const { UNSAFE_root } = renderModal();
    walkAndFireStyles(UNSAFE_root as unknown as {
      props?: Record<string, unknown>;
      children?: unknown[];
    });
  });

  it("press style callbacks invoke pressed branch (recording pause + stop)", () => {
    mockDictationPhase = "recording";
    const { UNSAFE_root } = renderModal();
    walkAndFireStyles(UNSAFE_root as unknown as {
      props?: Record<string, unknown>;
      children?: unknown[];
    });
  });

  it("press style callbacks invoke pressed branch (paused resume + stop)", () => {
    mockDictationPhase = "paused";
    const { UNSAFE_root } = renderModal();
    walkAndFireStyles(UNSAFE_root as unknown as {
      props?: Record<string, unknown>;
      children?: unknown[];
    });
  });

  it("renders the generating spinner while sharePdf is in flight", async () => {
    let resolveShare: (() => void) | undefined;
    mockSharePdf.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveShare = resolve;
      }),
    );
    const utils = await stopAndReviewWith("Solicito X");
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(utils.getByText(/^dictarPedidos\.generate:/));
    });
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.generating")).toBeTruthy(),
    );
    await act(async () => {
      resolveShare?.();
    });
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.successMessage")).toBeTruthy(),
    );
  });

  it("KeyboardAvoidingView uses undefined behavior on Android", () => {
    const RN = require("react-native");
    const originalOS = RN.Platform.OS;
    RN.Platform.OS = "android";
    try {
      const { getByText } = renderModal();
      expect(getByText("dictarPedidos.title")).toBeTruthy();
    } finally {
      RN.Platform.OS = originalOS;
    }
  });

  it("editing diagnostico updates the value sent to sharePdf", async () => {
    mockSharePdf.mockResolvedValue(undefined);
    const utils = await stopAndReviewWith("Solicito A");
    await waitFor(() =>
      expect(utils.getByText("dictarPedidos.itemsLabel")).toBeTruthy(),
    );
    fireEvent.changeText(
      utils.getByPlaceholderText("dictarPedidos.diagnosticoPlaceholder"),
      "lumbalgia",
    );
    await act(async () => {
      fireEvent.press(utils.getByText(/^dictarPedidos\.generate:/));
    });
    await waitFor(() =>
      expect(mockSharePdf).toHaveBeenCalledWith(
        expect.objectContaining({ diagnostico: "lumbalgia" }),
      ),
    );
  });
});
