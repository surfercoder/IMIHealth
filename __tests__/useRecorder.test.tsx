import { renderHook, act, waitFor } from "@testing-library/react-native";

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
    requestRecordingPermissionsAsync: () =>
      mockAudioPermissionRequest.current(),
  },
  setAudioModeAsync: () => Promise.resolve(),
}));

const mockAudioPermissionRequest: { current: () => Promise<{ granted: boolean }> } = {
  current: async () => ({ granted: true }),
};

const mockActivateKeepAwake = jest.fn();
const mockDeactivateKeepAwake = jest.fn();
jest.mock("expo-keep-awake", () => ({
  activateKeepAwakeAsync: (tag: string) => mockActivateKeepAwake(tag),
  deactivateKeepAwake: (tag: string) => mockDeactivateKeepAwake(tag),
}));

jest.mock("react-native", () => ({
  Alert: { alert: jest.fn() },
}));

import { formatDuration, useRecorder } from "@/src/hooks/useRecorder";

beforeEach(() => {
  mockRecorder = {
    uri: "file://x",
    prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
    record: jest.fn(),
    stop: jest.fn().mockResolvedValue(undefined),
  };
  mockRecorderState = { isRecording: false };
  mockAudioPermissionRequest.current = async () => ({ granted: true });
  mockActivateKeepAwake.mockClear();
  mockDeactivateKeepAwake.mockClear();
});

describe("formatDuration", () => {
  it("formats ms into mm:ss", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(65_000)).toBe("01:05");
    expect(formatDuration(3_600_000)).toBe("60:00");
  });
});

describe("useRecorder", () => {
  it("requests permission and transitions to idle when granted", async () => {
    const { result } = renderHook(() => useRecorder());
    await waitFor(() => expect(result.current.phase).toBe("idle"));
  });

  it("permission denied transitions to permissionDenied phase", async () => {
    mockAudioPermissionRequest.current = async () => ({ granted: false });
    const { result } = renderHook(() => useRecorder());
    await waitFor(() => expect(result.current.phase).toBe("permissionDenied"));
  });

  it("start() puts phase into recording", async () => {
    const { result } = renderHook(() => useRecorder());
    await waitFor(() => expect(result.current.phase).toBe("idle"));
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.phase).toBe("recording");
  });

  it("start() is a no-op when permission denied", async () => {
    mockAudioPermissionRequest.current = async () => ({ granted: false });
    const { result } = renderHook(() => useRecorder());
    await waitFor(() => expect(result.current.phase).toBe("permissionDenied"));
    await act(async () => {
      await result.current.start();
    });
    expect(mockRecorder.record).not.toHaveBeenCalled();
  });

  it("stop() returns early when not recording", async () => {
    const { result } = renderHook(() => useRecorder());
    await waitFor(() => expect(result.current.phase).toBe("idle"));
    let out: { uri: string | null; durationMs: number } | undefined;
    await act(async () => {
      out = await result.current.stop();
    });
    expect(out?.uri).toBe("file://x");
  });

  it("stop() flips phase to stopped when recording", async () => {
    mockRecorderState = { isRecording: true };
    const { result } = renderHook(() => useRecorder());
    await waitFor(() => expect(result.current.phase).toBe("idle"));
    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.stop();
    });
    expect(result.current.phase).toBe("stopped");
  });

  it("reset() returns to idle", async () => {
    const { result } = renderHook(() => useRecorder());
    await waitFor(() => expect(result.current.phase).toBe("idle"));
    await act(async () => {
      await result.current.start();
    });
    act(() => result.current.reset());
    expect(result.current.phase).toBe("idle");
  });

  it("keeps the screen awake while recording and releases it on stop", async () => {
    mockRecorderState = { isRecording: true };
    const { result } = renderHook(() => useRecorder());
    await waitFor(() => expect(result.current.phase).toBe("idle"));
    expect(mockActivateKeepAwake).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.start();
    });
    expect(mockActivateKeepAwake).toHaveBeenCalledWith("imi-recorder");
    expect(mockDeactivateKeepAwake).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.stop();
    });
    expect(mockDeactivateKeepAwake).toHaveBeenCalledWith("imi-recorder");
  });

  it("releases keep-awake on unmount if still recording", async () => {
    const { result, unmount } = renderHook(() => useRecorder());
    await waitFor(() => expect(result.current.phase).toBe("idle"));
    await act(async () => {
      await result.current.start();
    });
    expect(mockActivateKeepAwake).toHaveBeenCalledTimes(1);
    unmount();
    expect(mockDeactivateKeepAwake).toHaveBeenCalledWith("imi-recorder");
  });
});
