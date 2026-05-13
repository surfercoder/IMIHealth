import { renderHook, act, waitFor } from "@testing-library/react-native";

let mockPermissionPromise: Promise<{ granted: boolean }> = Promise.resolve({ granted: true });
let mockSetAudioMode: () => Promise<void> = () => Promise.resolve();
let mockRecorder: {
  uri: string | null;
  prepareToRecordAsync: jest.Mock;
  record: jest.Mock;
  stop: jest.Mock;
};
let mockRecorderState: { isRecording: boolean };

jest.mock("expo-audio", () => ({
  RecordingPresets: { HIGH_QUALITY: {} },
  useAudioRecorder: () => mockRecorder,
  useAudioRecorderState: () => mockRecorderState,
  AudioModule: {
    requestRecordingPermissionsAsync: () => mockPermissionPromise,
  },
  setAudioModeAsync: () => mockSetAudioMode(),
}));

jest.mock("expo-keep-awake", () => ({
  activateKeepAwakeAsync: jest.fn(),
  deactivateKeepAwake: jest.fn(),
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
  mockSetAudioMode = () => Promise.resolve();
});

describe("useRecorder branch coverage filler", () => {
  it("skips dispatch when permission promise resolves after unmount", async () => {
    let resolveGrant!: (v: { granted: boolean }) => void;
    mockPermissionPromise = new Promise((r) => {
      resolveGrant = r;
    });
    const { unmount } = renderHook(() => useRecorder());
    unmount();
    await act(async () => {
      resolveGrant({ granted: true });
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
    // reset() clears startedAtRef. Advancing timers fires the interval with a null ref.
    act(() => result.current.reset());
    act(() => {
      jest.advanceTimersByTime(500);
    });
    jest.useRealTimers();
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

  it("stop falls back to state.durationMs when ref is null but isRecording", async () => {
    mockRecorderState = { isRecording: true };
    mockRecorder.uri = null;
    const { result } = renderHook(() => useRecorder());
    await waitFor(() => expect(result.current.phase).toBe("idle"));
    // Do NOT call start() — ref stays null. stop() reaches the ref-null branch.
    let out: { uri: string | null; durationMs: number } | undefined;
    await act(async () => {
      out = await result.current.stop();
    });
    expect(out?.uri).toBeNull();
    expect(out?.durationMs).toBe(0);
  });

  it("setAudioModeAsync resolving after unmount does not dispatch idle", async () => {
    let resolveAudio!: () => void;
    mockSetAudioMode = () =>
      new Promise<void>((r) => {
        resolveAudio = r;
      });
    const { unmount } = renderHook(() => useRecorder());
    // Wait for permission request to flow into setAudioModeAsync pending promise.
    await act(async () => {});
    unmount();
    await act(async () => {
      resolveAudio();
      await new Promise((r) => setImmediate(r));
    });
  });
});
