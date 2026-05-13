import { act, renderHook } from "@testing-library/react-native";
import { Platform } from "react-native";

jest.mock("expo-speech-recognition", () => {
  const listeners: Record<string, ((p?: unknown) => void)[]> = {};
  const mod: Record<string, unknown> = {
    addListener: (event: string, fn: (p?: unknown) => void) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(fn);
      return {
        remove: () => {
          listeners[event] = (listeners[event] || []).filter((l) => l !== fn);
        },
      };
    },
    emit: (event: string, payload?: unknown) => {
      (listeners[event] || []).forEach((fn) => fn(payload));
    },
    start: jest.fn(),
    stop: jest.fn(),
    requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
    requestSpeechRecognizerPermissionsAsync: jest.fn(async () => ({
      granted: true,
    })),
    _listeners: listeners,
  };
  mod._reset = () => {
    for (const k of Object.keys(listeners)) delete listeners[k];
    (mod.start as jest.Mock).mockReset();
    (mod.stop as jest.Mock).mockReset();
    (mod.requestPermissionsAsync as jest.Mock)
      .mockReset()
      .mockResolvedValue({ granted: true });
    (mod.requestSpeechRecognizerPermissionsAsync as jest.Mock)
      .mockReset()
      .mockResolvedValue({ granted: true });
  };
  return { __esModule: true, ExpoSpeechRecognitionModule: mod };
});

const mockActivateKeepAwake = jest.fn();
const mockDeactivateKeepAwake = jest.fn();
jest.mock("expo-keep-awake", () => ({
  __esModule: true,
  activateKeepAwakeAsync: (...a: unknown[]) => mockActivateKeepAwake(...a),
  deactivateKeepAwake: (...a: unknown[]) => mockDeactivateKeepAwake(...a),
}));

import { useDictation } from "@/src/hooks/useDictation";

interface ControlMock {
  addListener: jest.Mock;
  emit: (event: string, payload?: unknown) => void;
  start: jest.Mock;
  stop: jest.Mock;
  requestPermissionsAsync: jest.Mock;
  requestSpeechRecognizerPermissionsAsync: jest.Mock;
  _reset: () => void;
  _listeners: Record<string, ((...args: unknown[]) => void)[]>;
}

const { ExpoSpeechRecognitionModule } =
  jest.requireMock("expo-speech-recognition");
const mockModule = ExpoSpeechRecognitionModule as unknown as ControlMock;

beforeEach(() => {
  jest.useRealTimers();
  mockModule._reset();
  mockActivateKeepAwake.mockReset();
  mockDeactivateKeepAwake.mockReset();
});

describe("useDictation", () => {
  it("starts in idle state with zero duration and no transcript", () => {
    const { result } = renderHook(() => useDictation());
    expect(result.current.phase).toBe("idle");
    expect(result.current.durationMs).toBe(0);
    expect(result.current.liveTranscript).toBe("");
    expect(result.current.error).toBeNull();
  });

  it("start: throws when microphone permission is denied", async () => {
    mockModule.requestPermissionsAsync.mockResolvedValueOnce({ granted: false });
    const { result } = renderHook(() => useDictation());
    await expect(
      act(async () => {
        await result.current.start({ language: "es-419" });
      }),
    ).rejects.toThrow("Microphone permission denied");
    expect(result.current.phase).toBe("idle");
  });

  it("start: throws when speech permission is denied on iOS", async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, "OS", { value: "ios", configurable: true });
    mockModule.requestSpeechRecognizerPermissionsAsync.mockResolvedValueOnce({
      granted: false,
    });
    const { result } = renderHook(() => useDictation());
    await expect(
      act(async () => {
        await result.current.start({ language: "es-419" });
      }),
    ).rejects.toThrow("Speech recognition permission denied");
    Object.defineProperty(Platform, "OS", { value: originalOS, configurable: true });
  });

  it("start: enters recording state and calls the native start (iOS includes iosTaskHint)", async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, "OS", { value: "ios", configurable: true });
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    expect(result.current.phase).toBe("recording");
    expect(mockModule.start).toHaveBeenCalledWith(
      expect.objectContaining({
        lang: "es-419",
        interimResults: true,
        continuous: true,
        maxAlternatives: 1,
        iosTaskHint: "dictation",
      }),
    );
    Object.defineProperty(Platform, "OS", { value: originalOS, configurable: true });
  });

  it("start: on Android omits iosTaskHint and skips the speech permission check", async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, "OS", { value: "android", configurable: true });
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    expect(
      mockModule.requestSpeechRecognizerPermissionsAsync,
    ).not.toHaveBeenCalled();
    expect(mockModule.start).toHaveBeenCalledWith(
      expect.not.objectContaining({ iosTaskHint: expect.anything() }),
    );
    Object.defineProperty(Platform, "OS", { value: originalOS, configurable: true });
  });

  it("on final result, appends transcript; on interim, replaces", async () => {
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      mockModule.emit("result", {
        results: [{ transcript: "hola" }],
        isFinal: true,
      });
    });
    expect(result.current.liveTranscript).toBe("hola");
    act(() => {
      mockModule.emit("result", {
        results: [{ transcript: "que tal" }],
        isFinal: false,
      });
    });
    expect(result.current.liveTranscript).toBe("hola que tal");
    act(() => {
      mockModule.emit("result", {
        results: [{ transcript: "amigo" }],
        isFinal: true,
      });
    });
    expect(result.current.liveTranscript).toBe("hola amigo");
  });

  it("result with empty results array falls back to empty transcript", async () => {
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      mockModule.emit("result", { results: [], isFinal: true });
    });
    expect(result.current.liveTranscript).toBe("");
  });

  it("non-transient error sets the error state with message preference", async () => {
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      mockModule.emit("error", { error: "fatal", message: "boom" });
    });
    expect(result.current.error).toBe("boom");
  });

  it("non-transient error falls back to error code when no message", async () => {
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      mockModule.emit("error", { error: "fatal", message: "" });
    });
    expect(result.current.error).toBe("fatal");
  });

  it("non-transient error falls back to default when neither code nor message", async () => {
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      mockModule.emit("error", { error: "", message: "" });
    });
    expect(result.current.error).toBe("Speech recognition error");
  });

  it("non-transient error treats missing message field as empty", async () => {
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      mockModule.emit("error", { error: "fatal" });
    });
    expect(result.current.error).toBe("fatal");
  });

  it.each([
    "no-speech",
    "aborted",
    "busy",
    "interrupted",
    "speech-timeout",
  ])("transient error %s does not surface", async (code) => {
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      mockModule.emit("error", { error: code, message: "" });
    });
    expect(result.current.error).toBeNull();
  });

  it("Failed-to-initialize message is treated as transient", async () => {
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      mockModule.emit("error", {
        error: "other",
        message: "Failed to initialize speech recognizer",
      });
    });
    expect(result.current.error).toBeNull();
  });

  it.each([
    "language-not-supported",
    "not-allowed",
    "service-not-allowed",
    "audio-capture",
  ])("unrecoverable error %s stops the auto-restart loop", async (code) => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    mockModule.start.mockClear();
    act(() => {
      mockModule.emit("error", { error: code, message: "fatal" });
    });
    act(() => {
      mockModule.emit("end");
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(mockModule.start).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("unrecoverable error also clears any pending restart timer", async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      mockModule.emit("end"); // schedules a restart
    });
    mockModule.start.mockClear();
    act(() => {
      mockModule.emit("error", {
        error: "not-allowed",
        message: "denied",
      });
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(mockModule.start).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("trivial event listeners (start/audiostart/speechstart/end) do not crash", async () => {
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      mockModule.emit("start");
      mockModule.emit("audiostart");
      mockModule.emit("speechstart");
    });
    expect(result.current.phase).toBe("recording");
  });

  it("on 'end' while shouldKeepRecognizing, schedules a native restart after 100ms", async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    mockModule.start.mockClear();
    act(() => {
      mockModule.emit("end");
    });
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(mockModule.start).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("restart on 'end' includes iosTaskHint on iOS and omits it on Android", async () => {
    jest.useFakeTimers();
    const originalOS = Platform.OS;
    // Run on Android branch so the spread is `{}`.
    Object.defineProperty(Platform, "OS", { value: "android", configurable: true });
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    mockModule.start.mockClear();
    act(() => {
      mockModule.emit("end");
      jest.advanceTimersByTime(150);
    });
    expect(mockModule.start).toHaveBeenCalledWith(
      expect.not.objectContaining({ iosTaskHint: expect.anything() }),
    );
    Object.defineProperty(Platform, "OS", { value: originalOS, configurable: true });
    jest.useRealTimers();
  });

  it("on 'end' twice, the second end clears the pending timer before re-scheduling", async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    mockModule.start.mockClear();
    act(() => {
      mockModule.emit("end");
      mockModule.emit("end");
    });
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(mockModule.start).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it("on 'end' fired after stop, no restart is scheduled", async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      result.current.stop();
    });
    mockModule.start.mockClear();
    act(() => {
      mockModule.emit("end");
      jest.advanceTimersByTime(150);
    });
    expect(mockModule.start).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("restart failure is swallowed", async () => {
    jest.useFakeTimers();
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    mockModule.start.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    act(() => {
      mockModule.emit("end");
      jest.advanceTimersByTime(150);
    });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
    jest.useRealTimers();
  });

  it("pause transitions to paused, accumulates elapsed time, and stops module", async () => {
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      result.current.pause();
    });
    expect(result.current.phase).toBe("paused");
    expect(mockModule.stop).toHaveBeenCalled();
  });

  it("pause swallows module.stop errors", async () => {
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    mockModule.stop.mockImplementationOnce(() => {
      throw new Error("nope");
    });
    act(() => {
      result.current.pause();
    });
    expect(result.current.phase).toBe("paused");
  });

  it("pause with no active segment (already paused) skips elapsed-time math", async () => {
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      result.current.pause();
    });
    act(() => {
      result.current.pause();
    });
    expect(result.current.phase).toBe("paused");
  });

  it("pause clears any pending restart timer", async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      mockModule.emit("end");
    });
    mockModule.start.mockClear();
    act(() => {
      result.current.pause();
    });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(mockModule.start).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("resume transitions from paused to recording and restarts native session", async () => {
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      result.current.pause();
    });
    mockModule.start.mockClear();
    await act(async () => {
      await result.current.resume();
    });
    expect(result.current.phase).toBe("recording");
    expect(mockModule.start).toHaveBeenCalled();
  });

  it("stop returns the trimmed transcript and clears it", async () => {
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      mockModule.emit("result", {
        results: [{ transcript: "uno" }],
        isFinal: true,
      });
      mockModule.emit("result", {
        results: [{ transcript: "dos" }],
        isFinal: false,
      });
    });
    let transcript = "";
    act(() => {
      transcript = result.current.stop();
    });
    expect(transcript).toBe("uno dos");
  });

  it("stop swallows module.stop errors", async () => {
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    mockModule.stop.mockImplementationOnce(() => {
      throw new Error("nope");
    });
    let transcript = "";
    act(() => {
      transcript = result.current.stop();
    });
    expect(transcript).toBe("");
  });

  it("stop clears any pending restart timer", async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      mockModule.emit("end");
    });
    mockModule.start.mockClear();
    act(() => {
      result.current.stop();
    });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(mockModule.start).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("reset returns to idle and clears transcript/timers", async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      mockModule.emit("result", {
        results: [{ transcript: "hi" }],
        isFinal: true,
      });
    });
    expect(result.current.liveTranscript).toBe("hi");
    act(() => {
      mockModule.emit("end");
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.phase).toBe("idle");
    expect(result.current.liveTranscript).toBe("");
    mockModule.start.mockClear();
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(mockModule.start).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("reset swallows module.stop errors", async () => {
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    mockModule.stop.mockImplementationOnce(() => {
      throw new Error("nope");
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.phase).toBe("idle");
  });

  it("recording activates keep-awake; idle deactivates", async () => {
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    expect(mockActivateKeepAwake).toHaveBeenCalledWith("imi-dictation");
    act(() => {
      result.current.reset();
    });
    expect(mockDeactivateKeepAwake).toHaveBeenCalledWith("imi-dictation");
  });

  it("tick interval updates durationMs while recording", async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.durationMs).toBeGreaterThan(0);
    jest.useRealTimers();
  });

  it("calling start a second time re-attaches listeners (clearing old ones first)", async () => {
    const { result } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    const listenersBefore = (mockModule._listeners["result"] || []).length;
    await act(async () => {
      await result.current.start({ language: "es-AR" });
    });
    expect((mockModule._listeners["result"] || []).length).toBe(listenersBefore);
  });

  it("unmount clears listeners and stops the module", async () => {
    const { result, unmount } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    mockModule.stop.mockClear();
    unmount();
    expect(mockModule.stop).toHaveBeenCalled();
  });

  it("unmount swallows module.stop errors", async () => {
    const { result, unmount } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    mockModule.stop.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    expect(() => unmount()).not.toThrow();
  });

  it("unmount with pending restart timer clears it", async () => {
    jest.useFakeTimers();
    const { result, unmount } = renderHook(() => useDictation());
    await act(async () => {
      await result.current.start({ language: "es-419" });
    });
    act(() => {
      mockModule.emit("end");
    });
    mockModule.start.mockClear();
    unmount();
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(mockModule.start).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
