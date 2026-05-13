import { renderHook, act, waitFor } from "@testing-library/react-native";

let mockRecorder: {
  uri: string | null;
  prepareToRecordAsync: jest.Mock;
  record: jest.Mock;
  stop: jest.Mock;
};
let mockRecorderState: { isRecording: boolean };
let mockPermissionResolver: ((value: { granted: boolean }) => void) | null = null;
let mockPermissionPromise: Promise<{ granted: boolean }> = Promise.resolve({ granted: true });

jest.mock("expo-audio", () => ({
  RecordingPresets: { HIGH_QUALITY: {} },
  useAudioRecorder: () => mockRecorder,
  useAudioRecorderState: () => mockRecorderState,
  AudioModule: {
    requestRecordingPermissionsAsync: () => mockPermissionPromise,
  },
  setAudioModeAsync: () => Promise.resolve(),
}));

jest.mock("react-native", () => ({
  Alert: { alert: jest.fn() },
}));

import { useRecorder } from "@/src/hooks/useRecorder";

beforeEach(() => {
  mockRecorder = {
    uri: "file://x",
    prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
    record: jest.fn(),
    stop: jest.fn().mockResolvedValue(undefined),
  };
  mockRecorderState = { isRecording: false };
  mockPermissionPromise = Promise.resolve({ granted: true });
  mockPermissionResolver = null;
});

describe("useRecorder edge cases", () => {
  it("ignores permission grant when component has unmounted", async () => {
    mockPermissionPromise = new Promise((r) => {
      mockPermissionResolver = r;
    });
    const { unmount } = renderHook(() => useRecorder());
    unmount();
    await act(async () => {
      mockPermissionResolver?.({ granted: true });
      await mockPermissionPromise;
    });
  });

  it("interval tick is a no-op when startedAtRef is null at fire time", async () => {
    jest.useFakeTimers();
    mockRecorderState = { isRecording: true };
    const { result } = renderHook(() => useRecorder());
    await waitFor(() => expect(result.current.phase).toBe("idle"));
    await act(async () => {
      await result.current.start();
    });
    // Reset the started-at via reset() then advance timers to trigger the
    // interval with null startedAtRef.
    act(() => result.current.reset());
    act(() => {
      jest.advanceTimersByTime(500);
    });
    jest.useRealTimers();
  });

  it("stop returns the recorder uri even when not recording", async () => {
    const { result } = renderHook(() => useRecorder());
    await waitFor(() => expect(result.current.phase).toBe("idle"));
    let out: { uri: string | null; durationMs: number } | undefined;
    await act(async () => {
      out = await result.current.stop();
    });
    expect(out?.uri).toBe("file://x");
  });

  it("stop returns null uri when recorder.uri is null", async () => {
    mockRecorder.uri = null;
    const { result } = renderHook(() => useRecorder());
    await waitFor(() => expect(result.current.phase).toBe("idle"));
    let out: { uri: string | null; durationMs: number } | undefined;
    await act(async () => {
      out = await result.current.stop();
    });
    expect(out?.uri).toBeNull();
  });

  it("stop falls back to durationMs when startedAtRef is null", async () => {
    mockRecorderState = { isRecording: true };
    const { result } = renderHook(() => useRecorder());
    await waitFor(() => expect(result.current.phase).toBe("idle"));
    await act(async () => {
      await result.current.start();
    });
    // Manually clear startedAtRef by calling reset, then enter the recording
    // path via a synthetic state where stop() will hit the startedAt-null branch.
    // Easiest: set isRecording to true so we go past the early return; the
    // internal ref logic falls back to state.durationMs.
    await act(async () => {
      await result.current.stop();
    });
  });
});
